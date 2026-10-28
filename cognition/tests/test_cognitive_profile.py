import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from courses.models import Course, Module, Lesson
from submissions.models import Problem, Submission
from cognition.models import AssessmentSession, CognitiveReport, CognitiveProfile
from cognition.services.profiling_service import CognitiveProfilingService

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def student_user(db):
    return User.objects.create_user(username='tensor_mind', password='password123', email='mind@synapse.ai')


@pytest.fixture
def lesson_fixture(db):
    course = Course.objects.create(title='Cognitive Architecture 101', price=0)
    module = Module.objects.create(course=course, title='Module 1', order=1)
    lesson = Lesson.objects.create(module=module, title='Lesson 1', order=1)
    return lesson


@pytest.mark.django_db
class TestCognitiveProfilingService:
    def test_get_baseline_profile(self, student_user):
        profile = CognitiveProfilingService.get_profile(student_user)
        assert profile.user == student_user
        assert profile.conceptual_understanding > 0.0
        assert profile.causal_reasoning > 0.0
        assert profile.transfer_ability > 0.0
        assert profile.error_detection > 0.0

    def test_recalculate_with_cognitive_reports_and_submissions(self, student_user, lesson_fixture):
        # 1. Create a converged assessment session with a cognitive report
        session = AssessmentSession.objects.create(
            user=student_user,
            lesson=lesson_fixture,
            status='converged',
        )
        CognitiveReport.objects.create(
            session=session,
            score=0.95,
            summary='Excelente raciocínio conceitual.',
            dimensions={
                'conceptual_understanding': 95.0,
                'causal_reasoning': 90.0,
                'transfer_ability': 85.0,
                'error_detection': 88.0,
            }
        )

        # 2. Create a problem and successful sandbox submission
        problem = Problem.objects.create(
            title='Fix Binary Search',
            description='Debug binary search algorithm',
            course=lesson_fixture.module.course,
            lesson=lesson_fixture,
            initial_code='def search(): pass',
            public_tests='assert True'
        )
        Submission.objects.create(
            user=student_user,
            problem=problem,
            code='def search(): return 0',
            status='success'
        )

        profile = CognitiveProfilingService.recalculate_profile(student_user)
        assert profile.conceptual_understanding >= 90.0
        assert profile.causal_reasoning >= 90.0
        assert profile.error_detection >= 85.0


@pytest.mark.django_db
class TestCognitiveProfileAPI:
    def test_get_profile_authenticated(self, api_client, student_user):
        api_client.force_authenticate(user=student_user)
        response = api_client.get('/api/v1/cognition/profile/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['username'] == 'tensor_mind'
        assert 'conceptual_understanding' in response.data
        assert 'causal_reasoning' in response.data
        assert 'transfer_ability' in response.data
        assert 'error_detection' in response.data
        assert 'convergence_rate' in response.data
        assert 'total_sessions' in response.data

    def test_recalculate_profile_post(self, api_client, student_user):
        api_client.force_authenticate(user=student_user)
        response = api_client.post('/api/v1/cognition/profile/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['username'] == 'tensor_mind'

    def test_profile_unauthenticated_fails(self, api_client):
        response = api_client.get('/api/v1/cognition/profile/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
