from django.db import models


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class AuditEntry(models.Model):
    audit_id = models.UUIDField(primary_key=True, editable=False)
    actor_id = models.CharField(max_length=255, null=True, blank=True)
    entity_type = models.CharField(max_length=255)
    entity_id = models.CharField(max_length=255, null=True, blank=True)
    action = models.CharField(max_length=255)
    details = models.JSONField(default=dict, blank=True)
    correlation_id = models.CharField(max_length=255, db_index=True)
    timestamp = models.DateTimeField()

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"AuditEntry {self.audit_id} {self.action}"
