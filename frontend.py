#!/usr/bin/env python3
"""
frontend.py

Start the frontend dev server from the repo root exposing it to 0.0.0.0.

Usage:
  python frontend.py [--host HOST] [--port PORT]

This script will:
 - detect package manager (yarn / pnpm / npm)
 - set HOST env var to the requested host (default 0.0.0.0)
 - run the `dev` script forwarding extra args when supported
 - forward SIGINT/SIGTERM to the child process

Designed for local development convenience.
"""

import os
import sys
import subprocess
import signal
from shutil import which


FRONTEND_DIR = os.path.join(os.path.dirname(__file__), 'frontend')


def detect_package_manager():
    # prefer pnpm, yarn, then npm
    if os.path.exists(os.path.join(FRONTEND_DIR, 'pnpm-lock.yaml')) and which('pnpm'):
        return 'pnpm'
    if os.path.exists(os.path.join(FRONTEND_DIR, 'yarn.lock')) and which('yarn'):
        return 'yarn'
    if which('npm'):
        return 'npm'
    return None


def build_command(pm, host, port=None):
    # Build a command list suited for the package manager
    host_args = ['--host', host]
    if port:
        host_args += ['--port', str(port)]

    if pm == 'yarn':
        # yarn dev --host 0.0.0.0
        return ['yarn', 'dev'] + host_args
    if pm == 'pnpm':
        # pnpm run dev -- --host 0.0.0.0
        return ['pnpm', 'run', 'dev', '--'] + host_args
    # default npm
    return ['npm', 'run', 'dev', '--'] + host_args


def build_step_command(pm):
    # Command to build the project before starting dev server
    if pm == 'yarn':
        return ['yarn', 'build']
    if pm == 'pnpm':
        return ['pnpm', 'build']
    return ['npm', 'run', 'build']


def main(argv):
    import argparse

    p = argparse.ArgumentParser(description='Start frontend dev server (expose to 0.0.0.0)')
    p.add_argument('--host', default=os.environ.get('HOST', '0.0.0.0'))
    p.add_argument('--port', default=os.environ.get('PORT'))
    args = p.parse_args(argv)

    if not os.path.isdir(FRONTEND_DIR):
        print('Frontend directory not found at', FRONTEND_DIR)
        sys.exit(1)

    pm = detect_package_manager()
    if not pm:
        print('No package manager found (npm/pnpm/yarn). Please install one.')
        sys.exit(1)

    cmd = build_command(pm, args.host, args.port)

    env = os.environ.copy()
    env['HOST'] = args.host
    if args.port:
        env['PORT'] = str(args.port)

    # 1. Executar o build antes de iniciar o dev server
    b_cmd = build_step_command(pm)
    print(f'Building in {FRONTEND_DIR} with {pm}:', ' '.join(b_cmd))
    try:
        subprocess.run(b_cmd, cwd=FRONTEND_DIR, env=env, check=True)
    except subprocess.CalledProcessError as e:
        print(f'Build failed with exit code {e.returncode}')
        sys.exit(e.returncode)

    # 2. Iniciar o dev server em um novo grupo de processo para limpeza robusta
    print(f'Starting dev server in {FRONTEND_DIR} with {pm}:', ' '.join(cmd))
    proc = subprocess.Popen(cmd, cwd=FRONTEND_DIR, env=env, start_new_session=True)

    def cleanup():
        if proc.poll() is None:
            try:
                # Mata o grupo de processos inteiro
                os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
                proc.wait(timeout=5)
            except Exception:
                try:
                    os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
                except Exception:
                    pass

    def handle(signum, frame):
        cleanup()
        sys.exit(0)

    signal.signal(signal.SIGINT, handle)
    signal.signal(signal.SIGTERM, handle)

    try:
        rc = proc.wait()
        return rc
    except (KeyboardInterrupt, SystemExit):
        cleanup()
        return 130
    finally:
        cleanup()


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
