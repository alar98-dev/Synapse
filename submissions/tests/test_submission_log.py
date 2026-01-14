import json
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from submissions.models import Submission, SubmissionLog, Problem
from sandbox.models import ExecutionJob
from courses.models import Course, Lesson, Module
from submissions.parsers import parse_python_unittest

User = get_user_model()


class SubmissionLogTest(TestCase):
    """Unit tests for SubmissionLog model and persistence logic."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='pass')
        self.course = Course.objects.create(title='Test Course', owner=self.user)
        self.module = Module.objects.create(course=self.course, title='Test Module')
        self.lesson = Lesson.objects.create(module=self.module, title='Test Lesson')
        self.problem = Problem.objects.create(title='Test Problem', owner=self.user, lesson=self.lesson, test_template='{student_code}\nprint("Tests passed")')

    def test_submission_log_creation_normal_flow(self):
        """Test that SubmissionLog is created with stdout/stderr after job completion."""
        # Create submission and job
        submission = Submission.objects.create(user=self.user, problem=self.problem, code='print("hello")', correlation_id='test-cid-123')
        job = ExecutionJob.objects.create(user=self.user, code='print("hello")\nprint("Tests passed")', status=ExecutionJob.STATUS_SUCCESS, stdout='hello\nTests passed', stderr='', exit_code=0, duration=1.5)
        submission.job = job
        submission.save()

        # Simulate log persistence (normally done in tasks.py)
        SubmissionLog.objects.create(
            submission=submission,
            job=job,
            correlation_id=submission.correlation_id,
            level='stdout',
            message=job.stdout,
            metadata={'exit_code': job.exit_code, 'duration': job.duration},
        )
        SubmissionLog.objects.create(
            submission=submission,
            job=job,
            correlation_id=submission.correlation_id,
            level='stderr',
            message=job.stderr,
            metadata={'exit_code': job.exit_code, 'duration': job.duration},
        )

        # Assertions
        logs = SubmissionLog.objects.filter(submission=submission)
        self.assertEqual(logs.count(), 2)
        stdout_log = logs.filter(level='stdout').first()
        stderr_log = logs.filter(level='stderr').first()
        self.assertIsNotNone(stdout_log)
        self.assertEqual(stdout_log.message, 'hello\nTests passed')
        self.assertEqual(stdout_log.metadata['exit_code'], 0)
        self.assertEqual(stdout_log.metadata['duration'], 1.5)
        self.assertEqual(stdout_log.correlation_id, 'test-cid-123')
        self.assertIsNotNone(stderr_log)
        self.assertEqual(stderr_log.message, '')

    def test_submission_log_persistence_on_timeout(self):
        """Test log persistence when job times out."""
        submission = Submission.objects.create(user=self.user, problem=self.problem, code='import time; time.sleep(10)', correlation_id='timeout-cid')
        job = ExecutionJob.objects.create(user=self.user, code='import time; time.sleep(10)', status=ExecutionJob.STATUS_CANCELED, stdout='', stderr='Execution timed out after 5 seconds', exit_code=-1, duration=5.0)

        submission.job = job
        submission.save()

        # Persist logs
        SubmissionLog.objects.create(
            submission=submission,
            job=job,
            correlation_id=submission.correlation_id,
            level='stderr',
            message=job.stderr,
            metadata={'exit_code': job.exit_code, 'duration': job.duration},
        )

        log = SubmissionLog.objects.filter(submission=submission, level='stderr').first()
        self.assertIsNotNone(log)
        self.assertEqual(log.message, 'Execution timed out after 5 seconds')
        self.assertEqual(log.metadata['exit_code'], -1)
        self.assertEqual(log.correlation_id, 'timeout-cid')

    def test_submission_log_persistence_on_exception(self):
        """Test log persistence when job fails with exception."""
        submission = Submission.objects.create(user=self.user, problem=self.problem, code='raise ValueError("test error")', correlation_id='exception-cid')
        job = ExecutionJob.objects.create(user=self.user, code='raise ValueError("test error")', status=ExecutionJob.STATUS_FAILED, stdout='', stderr='ValueError: test error', exit_code=1, duration=0.5)

        submission.job = job
        submission.save()

        # Persist logs
        SubmissionLog.objects.create(
            submission=submission,
            job=job,
            correlation_id=submission.correlation_id,
            level='stderr',
            message=job.stderr,
            metadata={'exit_code': job.exit_code, 'duration': job.duration},
        )

        log = SubmissionLog.objects.filter(submission=submission, level='stderr').first()
        self.assertIsNotNone(log)
        self.assertEqual(log.message, 'ValueError: test error')
        self.assertEqual(log.metadata['exit_code'], 1)
        self.assertEqual(log.correlation_id, 'exception-cid')