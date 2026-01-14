import os
import pytest
import requests

@pytest.fixture(scope='session')
def base_url():
    return os.getenv('INTEGRATION_BASE_URL', 'http://localhost:8000')

@pytest.fixture
def real_api_client(base_url):
    """
    A real API client using requests (no Django test client) to hit physical endpoints.
    """
    session = requests.Session()
    
    def _get_authenticated_client(username, password):
        # Physical login to get JWT
        login_url = f"{base_url}/api/v1/auth/token/"
        payload = {'username': username, 'password': password}
        response = session.post(login_url, json=payload)
        
        if response.status_code != 200:
            pytest.fail(f"Real Integration Login failed for {username}: {response.text}")
            
        token = response.json()['access']
        session.headers.update({'Authorization': f'Bearer {token}'})
        return session

    return _get_authenticated_client

@pytest.fixture
def admin_client(real_api_client):
    username = os.getenv('DJANGO_SUPERUSER_USERNAME')
    password = os.getenv('DJANGO_SUPERUSER_PASSWORD')
    if not username or not password:
        pytest.skip("Admin credentials missing in .env")
    return real_api_client(username, password)

@pytest.fixture
def instructor_client(real_api_client):
    username = os.getenv('DJANGO_INSTRUCTOR_USERNAME')
    password = os.getenv('DJANGO_INSTRUCTOR_PASSWORD')
    if not username or not password:
        pytest.skip("Instructor credentials missing in .env")
    return real_api_client(username, password)

@pytest.fixture
def student_client(real_api_client):
    username = os.getenv('DJANGO_STUDENT_USERNAME')
    password = os.getenv('DJANGO_STUDENT_PASSWORD')
    if not username or not password:
        pytest.skip("Student credentials missing in .env")
    return real_api_client(username, password)
