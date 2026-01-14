from django.db import models
from django.conf import settings
from sandbox.models import ExecutionJob


class Problem(models.Model):
    """Represents a coding problem / exercise with a test template.

    The `test_template` must include the token `{student_code}` where the student's code
    will be injected. The template should run assertions and print a summary to stdout.
    """

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='problems', null=True, blank=True)
    lesson = models.OneToOneField('courses.Lesson', on_delete=models.SET_NULL, null=True, blank=True, related_name='problem')
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='owned_problems')
    # Example: a python test harness where {student_code} will be replaced
    test_template = models.TextField(help_text='Use {student_code} placeholder where student code should be inserted')
    initial_code = models.TextField(blank=True, help_text='Initial code shown to the student')
    public_tests = models.TextField(blank=True, help_text='Units tests visible to the student (JSON or text).')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class Submission(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_RUNNING = 'running'
    STATUS_SUCCESS = 'success'
    STATUS_FAILED = 'failed'
    STATUS_CANCELED = 'canceled'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_RUNNING, 'Running'),
        (STATUS_SUCCESS, 'Success'),
        (STATUS_FAILED, 'Failed'),
        (STATUS_CANCELED, 'Canceled'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    problem = models.ForeignKey(Problem, related_name='submissions', on_delete=models.CASCADE)
    job = models.ForeignKey(ExecutionJob, related_name='submission', null=True, blank=True, on_delete=models.SET_NULL)
    code = models.TextField()
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)
    result_summary = models.TextField(blank=True, null=True)
    score = models.FloatField(default=0.0, help_text="Calculated score (0-100)")
    correlation_id = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Submission #{self.pk} - {self.problem.title} by {self.user}"


class SubmissionLog(models.Model):
    """Persistent, timestamped logs for submissions/execution jobs used for audit and forensics.

    Stores stdout/stderr and other execution messages with correlation to Submission and ExecutionJob.
    """

    submission = models.ForeignKey('submissions.Submission', related_name='logs', null=True, blank=True, on_delete=models.CASCADE)
    job = models.ForeignKey(ExecutionJob, related_name='logs', null=True, blank=True, on_delete=models.SET_NULL)
    correlation_id = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    level = models.CharField(max_length=16, default='info')
    message = models.TextField(blank=True)
    metadata = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Log {self.level} @ {self.created_at} (submission={self.submission_id} job={self.job_id})"
