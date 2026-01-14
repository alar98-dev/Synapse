from django.db import models
from django.conf import settings
from courses.models import Lesson


class AssessmentSession(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('converged', 'Converged'),
        ('failed', 'Failed'),
        ('escalated', 'Escalated to Human'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='assessment_sessions')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='assessment_sessions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    needs_human_intervention = models.BooleanField(default=False)
    started_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    metadata = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"Session: {self.user.username} - {self.lesson.title}"


class EvaluationTurn(models.Model):
    session = models.ForeignKey(AssessmentSession, on_delete=models.CASCADE, related_name='turns')
    speaker = models.CharField(max_length=20)  # 'student' or 'llm'
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    # Analysis from the LLM about this specific turn
    inference = models.JSONField(null=True, blank=True)

    class Meta:
        ordering = ['timestamp']


class CognitiveProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cognitive_profile')
    # Aggregated metrics
    conceptual_understanding = models.FloatField(default=0.0)
    causal_reasoning = models.FloatField(default=0.0)
    transfer_ability = models.FloatField(default=0.0)
    error_detection = models.FloatField(default=0.0)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile: {self.user.username}"


class CognitiveReport(models.Model):
    session = models.OneToOneField(AssessmentSession, on_delete=models.CASCADE, related_name='report')
    score = models.FloatField()
    summary = models.TextField()
    dimensions = models.JSONField()  # Break down of scores
    convergence_details = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Report: {self.session}"
