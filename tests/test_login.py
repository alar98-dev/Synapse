import random
import string
import pytest

def rand_username(prefix='login'):
    return prefix + ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))

@pytest.mark.django_db
def test_login_success_and_invalid(api_client):
    username = rand_username()
    password = 'LoginTest123!'
    email = f'{username}@example.com'

    # Register the user
    resp = api_client.post('/api/v1/auth/register/', {'username': username, 'password': password, 'email': email}, format='json')
    assert resp.status_code in (200, 201)

    # Successful token obtain
    token_resp = api_client.post('/api/v1/auth/token/', {'username': username, 'password': password}, format='json')
    assert token_resp.status_code == 200
    data = token_resp.json()
    assert 'access' in data and data['access']

    # Invalid credentials should not return token
    bad = api_client.post('/api/v1/auth/token/', {'username': username, 'password': 'wrongpassword'}, format='json')
    assert bad.status_code in (401, 400)
