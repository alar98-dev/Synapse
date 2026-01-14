from rest_framework import serializers
from .models import ExecutionJob


class ExecutionJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExecutionJob
        fields = ['id', 'user', 'code', 'language', 'status', 'stdout', 'stderr', 'exit_code', 'duration', 'created_at', 'started_at', 'finished_at']
        read_only_fields = ['status', 'stdout', 'stderr', 'exit_code', 'duration', 'created_at', 'started_at', 'finished_at']


class ExecuteCodeSerializer(serializers.Serializer):
    code = serializers.CharField()
    language = serializers.CharField(default='python')
