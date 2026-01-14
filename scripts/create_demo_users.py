#!/usr/bin/env python3
"""Create demo users (superuser, instructor, student) from environment variables.

Usage: python scripts/create_demo_users.py
Ensure the project's virtualenv is active and DJANGO_SETTINGS_MODULE is not required (script will set it).
"""
import os
import sys

PROJECT_SETTINGS = 'synapse_project.settings'

def main():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', PROJECT_SETTINGS)
    try:
        import django
        django.setup()
    except Exception as e:
        print('Failed to setup Django:', e)
        sys.exit(1)

    from django.contrib.auth import get_user_model
    User = get_user_model()

    def create_or_update(username, email, password, is_super=False, role=None):
        u, created = User.objects.get_or_create(username=username, defaults={'email': email})
        u.email = email
        if password:
            u.set_password(password)
        if role and hasattr(u, 'role'):
            u.role = role
        if is_super:
            u.is_staff = True
            u.is_superuser = True
        u.save()
        print(('Created' if created else 'Updated'), username, 'role=', getattr(u, 'role', None))

    # Superuser
    su_user = os.environ.get('DJANGO_SUPERUSER_USERNAME')
    su_pass = os.environ.get('DJANGO_SUPERUSER_PASSWORD')
    su_email = os.environ.get('DJANGO_SUPERUSER_EMAIL')
    if su_user and su_pass:
        create_or_update(su_user, su_email or f'{su_user}@localhost', su_pass, is_super=True, role='staff')

    # Instructor
    i_user = os.environ.get('DJANGO_INSTRUCTOR_USERNAME')
    i_pass = os.environ.get('DJANGO_INSTRUCTOR_PASSWORD')
    i_email = os.environ.get('DJANGO_INSTRUCTOR_EMAIL')
    if i_user and i_pass:
        create_or_update(i_user, i_email or f'{i_user}@localhost', i_pass, is_super=False, role='teacher')

    # Student
    s_user = os.environ.get('DJANGO_STUDENT_USERNAME')
    s_pass = os.environ.get('DJANGO_STUDENT_PASSWORD')
    s_email = os.environ.get('DJANGO_STUDENT_EMAIL')
    if s_user and s_pass:
        create_or_update(s_user, s_email or f'{s_user}@localhost', s_pass, is_super=False, role='student')

    print('Demo users created/updated.')

if __name__ == '__main__':
    main()
