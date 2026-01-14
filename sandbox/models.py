from django.db import models
from django.conf import settings


class ExecutionJob(models.Model):
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

    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    code = models.TextField()
    language = models.CharField(max_length=32, default='python')
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)
    stdout = models.TextField(blank=True, null=True)
    stderr = models.TextField(blank=True, null=True)
    exit_code = models.IntegerField(null=True, blank=True)
    duration = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    container_id = models.CharField(max_length=128, blank=True, null=True)
    correlation_id = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    timeout_seconds = models.PositiveIntegerField(default=10, help_text='Max seconds to allow execution')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"ExecutionJob #{self.pk} ({self.status})"
