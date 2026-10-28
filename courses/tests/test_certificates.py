import uuid
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from courses.models import Course, Module, Lesson, Progress, Certificate
from courses.services.certificate_service import CertificateService

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def test_user(db):
    return User.objects.create_user(username='grad_student', password='password123', email='student@synapse.edu')


@pytest.fixture
def course_with_lessons(db):
    course = Course.objects.create(title='Arquitetura Limpa e TDD', price=0)
    module = Module.objects.create(course=course, title='Módulo 1: Fundamentos', order=1)
    lesson1 = Lesson.objects.create(module=module, title='Aula 1: SOLID', order=1)
    lesson2 = Lesson.objects.create(module=module, title='Aula 2: Testes Unitários', order=2)
    return course, [lesson1, lesson2]


@pytest.mark.django_db
class TestCertificateService:
    def test_evaluate_eligibility_incomplete(self, test_user, course_with_lessons):
        course, (lesson1, lesson2) = course_with_lessons
        # Only complete 1 of 2 lessons
        Progress.objects.create(user=test_user, lesson=lesson1, is_completed=True)

        eligibility = CertificateService.evaluate_eligibility(test_user, course)
        assert eligibility["is_eligible"] is False
        assert eligibility["progress_percentage"] == 50.0
        assert eligibility["completed_lessons"] == 1
        assert eligibility["total_lessons"] == 2

    def test_claim_certificate_incomplete_fails(self, test_user, course_with_lessons):
        course, (lesson1, lesson2) = course_with_lessons
        result = CertificateService.claim_certificate(test_user, course)
        assert result["success"] is False
        assert "não concluiu" in result["error"]
        assert Certificate.objects.filter(user=test_user, course=course).exists() is False

    def test_claim_certificate_complete_success(self, test_user, course_with_lessons):
        course, (lesson1, lesson2) = course_with_lessons
        Progress.objects.create(user=test_user, lesson=lesson1, is_completed=True)
        Progress.objects.create(user=test_user, lesson=lesson2, is_completed=True)

        result = CertificateService.claim_certificate(test_user, course)
        assert result["success"] is True
        assert result["already_issued"] is False
        assert result["progress_percentage"] == 100.0

        cert_id = result["certificate_id"]
        assert uuid.UUID(cert_id)

        # Idempotency check: claiming again returns already_issued
        result_again = CertificateService.claim_certificate(test_user, course)
        assert result_again["success"] is True
        assert result_again["already_issued"] is True
        assert result_again["certificate_id"] == cert_id

    def test_verify_certificate_public(self, test_user, course_with_lessons):
        course, (lesson1, lesson2) = course_with_lessons
        cert = Certificate.objects.create(user=test_user, course=course)

        verify_result = CertificateService.verify_certificate(str(cert.id_code))
        assert verify_result["valid"] is True
        assert verify_result["student_username"] == test_user.username
        assert verify_result["course_title"] == course.title
        assert verify_result["certificate_id"] == str(cert.id_code)

    def test_verify_invalid_certificate(self):
        verify_result = CertificateService.verify_certificate(str(uuid.uuid4()))
        assert verify_result["valid"] is False


@pytest.mark.django_db
class TestCertificateAPI:
    def test_claim_and_verify_api_flow(self, api_client, test_user, course_with_lessons):
        course, (lesson1, lesson2) = course_with_lessons
        Progress.objects.create(user=test_user, lesson=lesson1, is_completed=True)
        Progress.objects.create(user=test_user, lesson=lesson2, is_completed=True)

        api_client.force_authenticate(user=test_user)

        # 1. Claim certificate via POST /courses/:id/certificate/
        res = api_client.post(f'/api/v1/courses/{course.id}/certificate/')
        assert res.status_code == status.HTTP_201_CREATED
        cert_id = res.data["certificate_id"]

        # 2. Query certificate eligibility via GET /courses/:id/certificate/
        res_get = api_client.get(f'/api/v1/courses/{course.id}/certificate/')
        assert res_get.status_code == status.HTTP_200_OK
        assert res_get.data["is_eligible"] is True
        assert res_get.data["certificate_id"] == cert_id

        # 3. Public verification without auth via GET /certificates/:id_code/verify/
        anon_client = APIClient()
        res_verify = anon_client.get(f'/api/v1/certificates/{cert_id}/verify/')
        assert res_verify.status_code == status.HTTP_200_OK
        assert res_verify.data["valid"] is True
        assert res_verify.data["course_title"] == course.title
        assert res_verify.data["student_username"] == test_user.username
