import json
import datetime
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from courses.models import Course, Cohort, Enrollment

User = get_user_model()


class CourseAPITest(TestCase):
    def setUp(self):
        self.client = Client()
        self.instructor = User.objects.create_user(
            username='instructor',
            email='inst@example.com',
            password='pass',
            role='teacher',
            is_staff=True,
        )
        self.student = User.objects.create_user(
            username='student',
            email='student@example.com',
            password='pass',
            role='student',
        )
        self.course = Course.objects.create(
            title='Software Engineering Architecture',
            description='SOLID, DDD, Design Patterns',
            owner=self.instructor,
            is_published=True,
            price=0.00,
        )
        self.cohort = Cohort.objects.create(
            course=self.course,
            title='Class 2026',
            start_date=datetime.date.today(),
            end_date=datetime.date.today() + datetime.timedelta(days=90),
            capacity=25,
            enrollment_open=True,
        )

    def test_list_courses_unauthenticated(self):
        resp = self.client.get('/api/v1/courses/')
        self.assertEqual(resp.status_code, 200)
        self.assertGreaterEqual(len(resp.json()), 1)

    def test_create_course_instructor_permission(self):
        self.client.login(username='instructor', password='pass')
        payload = {
            'title': 'Advanced Distributed Systems',
            'description': 'Event-driven architecture and zero-copy data pipelines',
            'level': 'advanced',
            'price': '49.90',
        }
        resp = self.client.post('/api/v1/courses/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.json()['title'], payload['title'])

    def test_student_enrollment_via_api(self):
        self.client.login(username='student', password='pass')
        payload = {'cohort': self.cohort.id}
        resp = self.client.post(
            f'/api/v1/courses/{self.course.id}/enroll/',
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_X_CORRELATION_ID='enrollment-test-cid',
        )
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(Enrollment.objects.filter(user=self.student, course=self.course).exists())

    def test_my_courses_endpoint(self):
        Enrollment.objects.create(user=self.student, course=self.course, is_active=True)
        self.client.login(username='student', password='pass')
        resp = self.client.get('/api/v1/courses/my_courses/')
        self.assertEqual(resp.status_code, 200)
        courses = resp.json()
        self.assertEqual(len(courses), 1)
        self.assertEqual(courses[0]['id'], self.course.id)
