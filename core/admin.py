from django.contrib import admin
from .models import AuditEntry


@admin.register(AuditEntry)
class AuditEntryAdmin(admin.ModelAdmin):
	list_display = ('audit_id', 'action', 'entity_type', 'entity_id', 'correlation_id', 'timestamp')
	search_fields = ('correlation_id', 'actor_id', 'entity_id', 'action')
	readonly_fields = ('audit_id', 'timestamp')
