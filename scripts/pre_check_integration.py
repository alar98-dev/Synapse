import os
import requests
import sys
from dotenv import load_dotenv

def pre_check():
    load_dotenv()
    print("--- Auditoria de Integração Real: Pré-check ---")
    
    # 1. Backend Connectivity
    base_url = os.getenv('INTEGRATION_BASE_URL', 'http://localhost:8000')
    try:
        resp = requests.get(f"{base_url}/api/v1/schema/", timeout=5)
        print(f"[OK] Backend alcançável em {base_url}")
    except Exception as e:
        print(f"[FAIL] Backend OFF ou Schema inacessível: {e}")
        return False

    # 2. .env Credentials Check
    required_keys = [
        'DJANGO_SUPERUSER_USERNAME', 'DJANGO_SUPERUSER_PASSWORD',
        'DJANGO_INSTRUCTOR_USERNAME', 'DJANGO_INSTRUCTOR_PASSWORD',
        'DJANGO_STUDENT_USERNAME', 'DJANGO_STUDENT_PASSWORD'
    ]
    missing = [key for key in required_keys if not os.getenv(key)]
    if missing:
        print(f"[FAIL] Credenciais ausentes no .env: {missing}")
        return False
    print("[OK] Credenciais de Personas (Admin/Instrutor/Aluno) carregadas.")

    # 3. LLM Gateway Check (Opcional - OpenAI exemplo)
    if os.getenv('OPENAI_API_KEY'):
        print("[INFO] OpenAI Key detectada. Testes de Cognição habilitados.")
    
    # 4. Docker Check (Sandbox Integration)
    executor_backend = os.getenv('EXECUTOR_BACKEND', 'local')
    if executor_backend == 'docker':
        import docker
        try:
            client = docker.from_env()
            client.ping()
            print("[OK] Docker Engine acessível para testes de Sandbox.")
        except Exception as e:
            print(f"[WARN] Docker backend configurado mas inacessível: {e}")
            print("      Testes de Sandbox podem falhar.")
    else:
        print(f"[INFO] Sandbox usando LocalExecutor ({executor_backend}).")

    print("--- Status: PRONTO PARA TESTES ---")
    return True

if __name__ == "__main__":
    if not pre_check():
        sys.exit(1)
    sys.exit(0)
