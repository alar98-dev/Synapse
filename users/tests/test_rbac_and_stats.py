import datetime
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from users.services.rbac_service import RBACService
from courses.models import Course, Module, Lesson, Progress, Enrollment
from submissions.models import Problem, Submission

User = get_user_model()


class RBACServiceTest(TestCase):
    def test_setup_default_groups_creates_groups_and_perms(self):
        summary = RBACService.setup_default_groups()
        self.assertIn('Administrators', summary)
        self.assertIn('Instructors', summary)
        self.assertIn('Students', summary)
        self.assertIn('Auditors', summary)

        # Verify group instances exist
        self.assertTrue(Group.objects.filter(name='Instructors').exists())
        self.assertTrue(Group.objects.filter(name='Students').exists())
        self.assertTrue(Group.objects.filter(name='Auditors').exists())

        # Verify instructors have course management permissions
        instructor_group = Group.objects.get(name='Instructors')
        perm_names = list(instructor_group.permissions.values_list('codename', flat=True))
        self.assertIn('add_course', perm_names)
        self.assertIn('add_lesson', perm_names)


class UserStatsAPITest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='stats_user', email='stats@example.com', password='pass', role='student')
        self.course = Course.objects.create(title='Stats Course', owner=self.user)
        self.module = Module.objects.create(course=self.course, title='Module 1')
        self.lesson = Lesson.objects.create(module=self.module, title='Lesson 1')
        self.problem = Problem.objects.create(title='Problem 1', owner=self.user, lesson=self.lesson)

    def test_stats_unauthenticated(self):
        resp = self.client.get('/api/v1/auth/me/stats/')
        self.assertEqual(resp.status_code, 401)

    def test_stats_authenticated_student(self):
        # Setup student activity
        Enrollment.objects.create(user=self.user, course=self.course, is_active=True)
        Progress.objects.create(user=self.user, lesson=self.lesson, is_completed=True)
        Submission.objects.create(user=self.user, problem=self.problem, code='print(1)', status='success')

        # Add to student group
        student_group, _ = Group.objects.get_or_create(name='Students')
        self.user.groups.add(student_group)

        self.client.login(username='stats_user', password='pass')
        resp = self.client.get('/api/v1/auth/me/stats/')
        self.assertEqual(resp.status_code, 200)

        data = resp.json()
        self.assertEqual(data['username'], 'stats_user')
        self.assertEqual(data['role'], 'student')
        self.assertIn('Students', data['groups'])
        self.assertEqual(data['streak_days'], 1)
        self.assertEqual(data['completed_lessons'], 1)
        self.assertEqual(data['successful_submissions'], 1)
        self.assertEqual(data['enrolled_courses'], 1)
