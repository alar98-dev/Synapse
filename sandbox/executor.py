import os
import tempfile
import subprocess
import shutil
import time
import logging
import signal
import resource
from typing import Optional, Dict, Callable
from django.conf import settings

logger = logging.getLogger(__name__)


def set_resource_limits():
    """Sets hard and soft limits for the subprocess to prevent resource exhaustion."""
    # Limit CPU time (seconds)
    resource.setrlimit(resource.RLIMIT_CPU, (10, 15))
    # Limit Memory (Bytes) - 256MB
    resource.setrlimit(resource.RLIMIT_AS, (256 * 1024 * 1024, 300 * 1024 * 1024))
    # Limit process count (prevent fork bombs)
    resource.setrlimit(resource.RLIMIT_NPROC, (10, 20))
    # Limit file size creation
    resource.setrlimit(resource.RLIMIT_FSIZE, (1024 * 1024, 2 * 1024 * 1024))
    # Create new process group
    os.setsid()


class BaseExecutor:
    def run_code(self, code: str, language: str = 'python', timeout: int = 10, on_output: Optional[Callable[[str, str], None]] = None) -> Dict:
        """Run the given code and return a dict with keys: stdout, stderr, exit_code, container_id
        container_id may be None for non-container backends.
        
        on_output(stream, content): Optional callback to stream output in real-time.
        """
        raise NotImplementedError()


class LocalExecutor(BaseExecutor):
    """Run code locally in a subprocess inside a temporary directory.

    This is NOT fully isolated and intended as a safer default for local/dev environments
    where Docker socket should be avoided. It uses `python` binary available on PATH.
    """

    def run_code(self, code: str, language: str = 'python', timeout: int = 10, on_output: Optional[Callable[[str, str], None]] = None) -> Dict:
        tmpdir = tempfile.mkdtemp(prefix='synapse-exec-')
        start = time.time()
        stdout = ''
        stderr = ''
        exit_code = -1
        try:
            if language != 'python':
                raise RuntimeError('LocalExecutor only supports python language')

            script_path = os.path.join(tmpdir, 'script.py')
            with open(script_path, 'w') as f:
                f.write(code)

            # Use Popen with resource limits and process group isolation
            proc = subprocess.Popen(
                ['python3', '-u', script_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                preexec_fn=set_resource_limits,
                env={"PYTHONPATH": os.getcwd(), "PATH": "/usr/bin:/bin"}  # Restricted PATH
            )

            # Simple output reading loop
            import threading

            def read_stream(stream, stream_name):
                nonlocal stdout, stderr
                try:
                    for line in stream:
                        if stream_name == 'stdout':
                            stdout += line
                        else:
                            stderr += line
                        if on_output:
                            on_output(stream_name, line)
                except Exception as e:
                    logger.error(f"Error reading {stream_name}: {e}")

            t1 = threading.Thread(target=read_stream, args=(proc.stdout, 'stdout'), daemon=True)
            t2 = threading.Thread(target=read_stream, args=(proc.stderr, 'stderr'), daemon=True)
            t1.start()
            t2.start()

            try:
                proc.wait(timeout=timeout)
                exit_code = proc.returncode
            except subprocess.TimeoutExpired:
                # RECURSIVE KILL: Terminate the whole process group
                os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
                stderr += f'\n[HARDENING]: ERR_TIMEOUT - Execution killed after {timeout}s'
                logger.warning(f"Process group {proc.pid} killed due to timeout.")
                exit_code = -137 # SIGKILL exit code
            except Exception as e:
                os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
                stderr += f'\n[HARDENING]: ERR_RESOURCE_LIMIT_HIT - {str(e)}'
                exit_code = -1
            finally:
                t1.join(timeout=1)
                t2.join(timeout=1)
                
        except Exception as e:
            stderr = str(e)
            exit_code = -1
        finally:
            try:
                shutil.rmtree(tmpdir)
            except Exception:
                pass

        return {
            'stdout': stdout,
            'stderr': stderr,
            'exit_code': exit_code,
            'container_id': None,
            'duration': time.time() - start,
        }


class DockerExecutor(BaseExecutor):
    IMAGE_MAP = {
        'python': 'python:3.11-slim',
        'nodejs': 'node:18-slim',
        'javascript': 'node:18-slim',
        'rust': 'rust:1.70-slim',
    }

    def __init__(self):
        try:
            # Respect feature flag in settings: disallow docker socket usage in prod
            if not getattr(settings, 'EXECUTOR_ALLOW_DOCKER_SOCKET', False):
                self.docker = None
                self.client = None
                logger.warning('DockerExecutor disabled by EXECUTOR_ALLOW_DOCKER_SOCKET flag')
                return

            import docker
            self.docker = docker
            # docker.from_env() will fail if socket unavailable or permission denied
            self.client = docker.from_env()
        except Exception:
            self.docker = None
            self.client = None

    def run_code(self, code: str, language: str = 'python', timeout: int = 10) -> Dict:
        start = time.time()
        image = self.IMAGE_MAP.get(language, 'python:3.11-slim')
        
        # Prepare command based on language
        if language == 'python':
            cmd = f"sh -c \"python - <<'PY'\n{code}\nPY\""
        elif language in ['nodejs', 'javascript']:
            cmd = f"node -e \"{code.replace('"', '\\"')}\""
        elif language == 'rust':
            # Rust requires a temporary file and compilation for a simple one-off
            # We'll use a slightly more complex sh command for Rust
            cmd = f"sh -c \"echo '{code}' > main.rs && rustc main.rs && ./main\""
        else:
            cmd = f"sh -c \"python - <<'PY'\n{code}\nPY\""

        container = None
        try:
            container = self.client.containers.create(
                image,
                command=cmd,
                network_disabled=True,
                mem_limit='256m',
                cpu_quota=50000,  # 50% of one core
                detach=True,
            )
            container.start()
            
            # Implementation of manual timeout since docker-py wait() is blocking
            start_wait = time.time()
            exit_code = None
            while time.time() - start_wait < timeout:
                container.reload()
                if container.status != 'running':
                    result = container.wait()
                    exit_code = result.get('StatusCode') if isinstance(result, dict) else 0
                    break
                time.sleep(0.5)
            
            if exit_code is None:
                # Timed out
                container.stop(timeout=1)
                stderr = f"Execution timed out after {timeout} seconds"
                exit_code = -137
            
            logs = container.logs(stdout=True, stderr=True)
            output = logs.decode('utf-8', errors='replace') if isinstance(logs, bytes) else str(logs)
            return {
                'stdout': output,
                'stderr': stderr if exit_code == -137 else '',
                'exit_code': exit_code,
                'container_id': container.id,
                'duration': time.time() - start,
            }
        except Exception as e:
            # try to capture logs if available
            try:
                if container:
                    logs = container.logs(stdout=True, stderr=True)
                    out = logs.decode('utf-8') if isinstance(logs, bytes) else str(logs)
                else:
                    out = ''
            except Exception:
                out = ''
            return {
                'stdout': out,
                'stderr': str(e),
                'exit_code': -1,
                'container_id': getattr(container, 'id', None) if container else None,
                'duration': time.time() - start,
            }
        finally:
            if container:
                try:
                    container.remove(force=True)
                except Exception:
                    pass

    def cancel(self, container_id: Optional[str]) -> bool:
        if not container_id or not self.client:
            return False
        try:
            container = self.client.containers.get(container_id)
            container.kill()
            container.remove(force=True)
            return True
        except Exception:
            return False


def get_executor() -> BaseExecutor:
    backend = getattr(settings, 'EXECUTOR_BACKEND', 'docker')
    if backend == 'local':
        return LocalExecutor()
    else:
        return DockerExecutor()
