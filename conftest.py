import os
import django
import pytest
from pathlib import Path

from django.contrib.auth import get_user_model


def pytest_configure():
    # Load .env if present
    try:
        from dotenv import load_dotenv

        env_path = Path('.') / '.env'
        if env_path.exists():
            load_dotenv(dotenv_path=env_path)
    except Exception:
        pass

    # Default to lightweight test settings that use SQLite in-memory
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'synapse_project.test_settings')
    django.setup()


@pytest.fixture(scope='session')
def django_user_model():
    return get_user_model()


@pytest.fixture(scope='function')
def create_demo_users(db, django_user_model):
    """Create demo users from environment variables if present."""
    User = django_user_model

    def _create(username, password, email=None, is_super=False, role=None):
        if not username or not password:
            return None
        email = email or f"{username}@example.com"
        u, created = User.objects.get_or_create(username=username, defaults={
            'email': email
        })
        u.email = email
        u.set_password(password)
        if is_super:
            u.is_staff = True
            u.is_superuser = True
        if hasattr(u, 'role') and role:
            setattr(u, 'role', role)
        u.save()
        return u

    users = {}
    users['superuser'] = _create(
        os.environ.get('DJANGO_SUPERUSER_USERNAME'),
        os.environ.get('DJANGO_SUPERUSER_PASSWORD'),
        os.environ.get('DJANGO_SUPERUSER_EMAIL'),
        is_super=True,
        role='staff',
    )
    users['instructor'] = _create(
        os.environ.get('DJANGO_INSTRUCTOR_USERNAME'),
        os.environ.get('DJANGO_INSTRUCTOR_PASSWORD'),
        os.environ.get('DJANGO_INSTRUCTOR_EMAIL'),
        is_super=False,
        role='teacher',
    )
    users['student'] = _create(
        os.environ.get('DJANGO_STUDENT_USERNAME'),
        os.environ.get('DJANGO_STUDENT_PASSWORD'),
        os.environ.get('DJANGO_STUDENT_EMAIL'),
        is_super=False,
        role='student',
    )

    return users


@pytest.fixture
def api_client(db, create_demo_users):
    from rest_framework.test import APIClient

    client = APIClient()
    return client


@pytest.fixture
def tokens(db, create_demo_users):
    """Return JWT access tokens for demo users (if credentials present)."""
    from rest_framework.test import APIClient
    client = APIClient()

    def _get_token(username, password):
        if not username or not password:
            return None
        resp = client.post('/api/v1/auth/token/', {'username': username, 'password': password}, format='json')
        if resp.status_code == 200:
            return resp.data.get('access')
        return None

    return {
        'superuser': _get_token(os.environ.get('DJANGO_SUPERUSER_USERNAME'), os.environ.get('DJANGO_SUPERUSER_PASSWORD')),
        'instructor': _get_token(os.environ.get('DJANGO_INSTRUCTOR_USERNAME'), os.environ.get('DJANGO_INSTRUCTOR_PASSWORD')),
        'student': _get_token(os.environ.get('DJANGO_STUDENT_USERNAME'), os.environ.get('DJANGO_STUDENT_PASSWORD')),
    }
