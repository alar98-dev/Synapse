import datetime
from django.test import TestCase
from django.contrib.auth import get_user_model
from courses.models import Course, Module, Lesson, Cohort, Enrollment, Progress
from courses.services import EnrollmentService, CohortLeaderboardService, PolarisClient, ProgressService
from unittest.mock import patch, Mock
from django.utils import timezone
from submissions.models import Problem, Submission

User = get_user_model()


class EnrollmentServiceTest(TestCase):
    def setUp(self):
        self.instructor = User.objects.create_user(username='instructor', email='inst@example.com', password='pass', role='teacher')
        self.student = User.objects.create_user(username='student1', email='student1@example.com', password='pass', role='student')
        self.course = Course.objects.create(
            title='DDD Architecture in Python',
            owner=self.instructor,
            is_published=True,
            price=0.00,
        )
        self.cohort = Cohort.objects.create(
            course=self.course,
            title='2026 Q1',
            start_date=datetime.date.today(),
            end_date=datetime.date.today() + datetime.timedelta(days=60),
            capacity=2,
            enrollment_open=True,
        )
        self.service = EnrollmentService()

    def test_enroll_user_success(self):
        result = self.service.enroll_user(self.student, self.course, cohort_id=self.cohort.id)
        self.assertTrue(result.success)
        self.assertTrue(result.created)
        self.assertEqual(result.status_code, 201)
        self.assertIsNotNone(result.enrollment)
        self.assertEqual(result.enrollment.cohort, self.cohort)

    def test_enroll_user_already_enrolled(self):
        # First enrollment
        self.service.enroll_user(self.student, self.course, cohort_id=self.cohort.id)
        # Duplicate enrollment
        result = self.service.enroll_user(self.student, self.course, cohort_id=self.cohort.id)
        self.assertTrue(result.success)
        self.assertFalse(result.created)
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.message, "User already enrolled")

    def test_enroll_cohort_closed(self):
        self.cohort.enrollment_open = False
        self.cohort.save()

        result = self.service.enroll_user(self.student, self.course, cohort_id=self.cohort.id)
        self.assertFalse(result.success)
        self.assertEqual(result.error_code, "COHORT_CLOSED")
        self.assertEqual(result.status_code, 400)

    def test_enroll_cohort_full_capacity(self):
        student2 = User.objects.create_user(username='student2', email='s2@example.com', password='pass')
        student3 = User.objects.create_user(username='student3', email='s3@example.com', password='pass')

        # Fill capacity (capacity=2)
        self.service.enroll_user(self.student, self.course, cohort_id=self.cohort.id)
        self.service.enroll_user(student2, self.course, cohort_id=self.cohort.id)

        # 3rd student attempts enrollment
        result = self.service.enroll_user(student3, self.course, cohort_id=self.cohort.id)
        self.assertFalse(result.success)
        self.assertEqual(result.error_code, "COHORT_FULL")
        self.assertEqual(result.status_code, 400)

    def test_bulk_enroll_by_emails(self):
        student2 = User.objects.create_user(username='student2', email='student2@example.com', password='pass')
        emails = ['student1@example.com', 'student2@example.com', 'nonexistent@example.com']

        results = self.service.bulk_enroll_by_emails(self.cohort, emails)
        self.assertEqual(len(results['enrolled']), 2)
        self.assertIn('student1@example.com', results['enrolled'])
        self.assertIn('student2@example.com', results['enrolled'])
        self.assertEqual(results['not_found'], ['nonexistent@example.com'])


class CohortLeaderboardServiceTest(TestCase):
    def setUp(self):
        self.instructor = User.objects.create_user(username='prof', email='prof@example.com', password='pass')
        self.student_a = User.objects.create_user(username='alice', email='alice@example.com', password='pass')
        self.student_b = User.objects.create_user(username='bob', email='bob@example.com', password='pass')

        self.course = Course.objects.create(title='Clean Code', owner=self.instructor)
        self.module = Module.objects.create(course=self.course, title='Module 1')
        self.lesson1 = Lesson.objects.create(module=self.module, title='Lesson 1')
        self.lesson2 = Lesson.objects.create(module=self.module, title='Lesson 2')
        self.problem = Problem.objects.create(title='Prob 1', owner=self.instructor, lesson=self.lesson1, course=self.course)

        self.cohort = Cohort.objects.create(
            course=self.course,
            title='Alpha',
            start_date=datetime.date.today(),
            end_date=datetime.date.today() + datetime.timedelta(days=30),
        )

        Enrollment.objects.create(user=self.student_a, course=self.course, cohort=self.cohort)
        Enrollment.objects.create(user=self.student_b, course=self.course, cohort=self.cohort)

    def test_leaderboard_calculation_and_sorting(self):
        # Alice completes 2 lessons (2 * 10 = 20 pts)
        Progress.objects.create(user=self.student_a, lesson=self.lesson1, is_completed=True)
        Progress.objects.create(user=self.student_a, lesson=self.lesson2, is_completed=True)

        # Bob completes 1 lesson (10 pts) + 1 successful submission (50 pts) = 60 pts
        Progress.objects.create(user=self.student_b, lesson=self.lesson1, is_completed=True)
        Submission.objects.create(user=self.student_b, problem=self.problem, code='print(1)', status='success')

        leaderboard = CohortLeaderboardService.calculate_leaderboard(self.cohort)
        self.assertEqual(len(leaderboard), 2)

        # Bob should be 1st with 60 points
        self.assertEqual(leaderboard[0]['username'], 'bob')
        self.assertEqual(leaderboard[0]['total_points'], 60)

        # Alice should be 2nd with 20 points
        self.assertEqual(leaderboard[1]['username'], 'alice')
        self.assertEqual(leaderboard[1]['total_points'], 20)


class PolarisClientTest(TestCase):
    def setUp(self):
        self.client = PolarisClient()

    @patch('requests.get')
    def test_check_health_success(self, mock_get):
        mock_get.return_value = Mock(status_code=200, json=lambda: {"ok": True})
        self.assertTrue(self.client.check_health())

    @patch('requests.get')
    def test_check_health_failure(self, mock_get):
        mock_get.side_effect = Exception("Connection refused")
        self.assertFalse(self.client.check_health())

    @patch('requests.post')
    def test_generate_challenge_scaffold_success(self, mock_post):
        mock_post.return_value = Mock(status_code=200, json=lambda: {"response": "Scaffold generated"})
        scaffold = self.client.generate_challenge_scaffold("Binary Search", "Implement binary search algorithm")
        self.assertIn("initial_code", scaffold)
        self.assertIn("test_template", scaffold)

    @patch('requests.post')
    def test_generate_challenge_scaffold_fallback(self, mock_post):
        mock_post.side_effect = Exception("Timeout")
        scaffold = self.client.generate_challenge_scaffold("Sorting", "QuickSort")
        self.assertIn("def solution():", scaffold["initial_code"])
        self.assertIn("assert solution is not None", scaffold["test_template"])


class ProgressServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='streak_user', email='streak@example.com', password='pass')
        self.course = Course.objects.create(title='Course for Streak', owner=self.user)
        self.module = Module.objects.create(course=self.course, title='M1')
        self.lessons = [
            Lesson.objects.create(module=self.module, title=f'L{i}', order=i)
            for i in range(1, 5)
        ]

    def test_zero_streak_without_progress(self):
        streak = ProgressService.calculate_streak(self.user)
        self.assertEqual(streak, 0)

    def test_streak_with_today_completed(self):
        p = Progress.objects.create(user=self.user, lesson=self.lessons[0], is_completed=True)
        streak = ProgressService.calculate_streak(self.user, reference_date=datetime.date.today())
        self.assertEqual(streak, 1)

    def test_multi_day_streak(self):
        today = datetime.date.today()
        # Create completions for today, yesterday, and 2 days ago
        for i, days_ago in enumerate([0, 1, 2]):
            record_date = today - datetime.timedelta(days=days_ago)
            p = Progress.objects.create(user=self.user, lesson=self.lessons[i], is_completed=True)
            naive_dt = datetime.datetime.combine(record_date, datetime.time(12, 0))
            aware_dt = timezone.make_aware(naive_dt) if timezone.is_naive(naive_dt) else naive_dt
            Progress.objects.filter(id=p.id).update(completed_at=aware_dt)

        streak = ProgressService.calculate_streak(self.user, reference_date=today)
        self.assertEqual(streak, 3)

    def test_broken_streak_due_to_gap(self):
        today = datetime.date.today()
        # Completed 3 days ago, but missed yesterday and 2 days ago
        p = Progress.objects.create(user=self.user, lesson=self.lessons[0], is_completed=True)
        naive_dt = datetime.datetime.combine(today - datetime.timedelta(days=3), datetime.time(12, 0))
        aware_dt = timezone.make_aware(naive_dt) if timezone.is_naive(naive_dt) else naive_dt
        Progress.objects.filter(id=p.id).update(completed_at=aware_dt)

        streak = ProgressService.calculate_streak(self.user, reference_date=today)
        self.assertEqual(streak, 0)


