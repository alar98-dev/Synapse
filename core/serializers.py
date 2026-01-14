from rest_framework import serializers
from .models import AuditEntry


class AuditEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditEntry
        fields = ['audit_id', 'actor_id', 'entity_type', 'entity_id', 'action', 'details', 'correlation_id', 'timestamp']
