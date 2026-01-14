import pytest
import time
from uuid import uuid4

@pytest.mark.integration
def test_v1_api_health_and_auth_flow(admin_client, base_url):
    """
    Fase 3: Teste real de integração fluindo pelo Admin.
    Valida /api/v1/ e rotas protegidas.
    """
    # 1. Check schema (OpenAPI)
    resp = admin_client.get(f'{base_url}/api/v1/schema/?format=json')
    assert resp.status_code == 200
    assert 'openapi' in resp.json()

    # 2. Check Users List (Self Identification)
    resp = admin_client.get(f'{base_url}/api/v1/auth/me/')
    assert resp.status_code == 200
    assert 'username' in resp.json()

@pytest.mark.integration
def test_instructor_course_creation_flow(instructor_client, base_url):
    """
    Fase 3: Fluxo Real de Instrutor criando um curso.
    Sem mocks, persiste no banco real.
    """
    unique_suffix = str(uuid4())[:8]
    course_data = {
        "title": f"Curso de Integração {unique_suffix}",
        "description": "Criado durante teste real de QA",
        "level": "intermediate",
        "price": "99.90"
    }
    
    # Criar curso
    resp = instructor_client.post(f'{base_url}/api/v1/courses/', json=course_data)
    assert resp.status_code == 201
    course_id = resp.json()['id']
    
    # Validar persistência
    get_resp = instructor_client.get(f'{base_url}/api/v1/courses/{course_id}/')
    assert get_resp.status_code == 200
    assert get_resp.json()['title'] == course_data['title']

@pytest.mark.integration
def test_student_sandbox_execution(student_client, base_url):
    """
    Fase 3: Fluxo Aluno interagindo com módulo externo (Docker Sandbox).
    """
    payload = {
        "code": "print('Integration Test Success')",
        "language": "python"
    }
    
    resp = student_client.post(f'{base_url}/api/v1/sandbox/submit/', json=payload)
    
    # Se o sandbox estiver UP, deve retornar 201 ou 200 dependendo do async
    assert resp.status_code in [200, 201]
    data = resp.json()
    assert 'job_id' in data or 'stdout' in data
