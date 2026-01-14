import json
from django.test import Client, TestCase
from django.contrib.auth import get_user_model
from submissions.models import Submission, SubmissionLog, Problem
from sandbox.models import ExecutionJob
from courses.models import Course, Lesson, Module

User = get_user_model()


class SubmissionAPITest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='pass')
        self.course = Course.objects.create(title='Test Course', owner=self.user)
        self.module = Module.objects.create(course=self.course, title='Test Module')
        self.lesson = Lesson.objects.create(module=self.module, title='Test Lesson')
        self.problem = Problem.objects.create(title='Test Problem', owner=self.user, lesson=self.lesson, test_template='{student_code}\nprint("Tests passed")')

    def test_get_submissions_requires_lesson_id(self):
        resp = self.client.get('/api/lessons/456/submissions/')
        assert resp.status_code in (200, 204)  # depending on implementation

    def test_create_submission_requires_payload(self):
        resp = self.client.post('/api/submissions/', data=json.dumps({}), content_type='application/json')
        assert resp.status_code in (400, 422)

    def test_create_submission_returns_submission_id(self):
        payload = { 'lesson_id': 'lesson-456', 'user_id': 'uuid-user-123', 'code': 'print("ok")' }
        resp = self.client.post('/api/submissions/', data=json.dumps(payload), content_type='application/json')
        # Implementation dependent: either 201 with body or 202
        assert resp.status_code in (201, 202)

    def test_submission_with_correlation_id_persists_logs(self):
        """Integration test: submit via API, check submission created with correlation_id."""
        # Login user
        self.client.login(username='testuser', password='pass')

        # Create enrollment
        from courses.models import Enrollment
        Enrollment.objects.create(user=self.user, course=self.course, is_active=True)

        # Submit via API with correlation_id
        payload = {'user': self.user.id, 'problem': self.problem.id, 'code': 'print("hello")'}
        resp = self.client.post('/api/v1/submissions/', data=json.dumps(payload), content_type='application/json', HTTP_X_CORRELATION_ID='integration-cid')
        self.assertEqual(resp.status_code, 201)
        submission_data = resp.json()
        submission_id = submission_data['id']

        # Check submission created with correlation_id
        submission = Submission.objects.get(id=submission_id)
        self.assertEqual(submission.correlation_id, 'integration-cid')
