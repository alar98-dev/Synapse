from django.contrib import admin
from .models import ExecutionJob


@admin.register(ExecutionJob)
class ExecutionJobAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'created_at', 'started_at', 'finished_at')
    readonly_fields = ('stdout', 'stderr')
