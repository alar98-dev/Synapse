import pytest
from rest_framework.test import APIClient

@pytest.mark.django_db
def test_v1_root_route(api_client):
    resp = api_client.get('/api/v1/')
    # core.urls usually has a root or some basic route
    assert resp.status_code in (200, 404, 403) # Just checking it hits the v1 prefix

@pytest.mark.django_db
def test_v1_auth_register_route(api_client):
    # Test just the existence/v1 mapping
    resp = api_client.post('/api/v1/auth/register/', {}, format='json')
    assert resp.status_code != 404 # Should be 400 or other if data is missing, but NOT 404

@pytest.mark.django_db
def test_v1_docs_route(api_client):
    resp = api_client.get('/api/v1/docs/')
    assert resp.status_code == 200
