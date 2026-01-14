from rest_framework import serializers
from .models import Problem, Submission
from sandbox.serializers import ExecutionJobSerializer


class ProblemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Problem
        fields = ['id', 'title', 'slug', 'description', 'initial_code', 'public_tests', 'created_at', 'updated_at']


class SubmissionSerializer(serializers.ModelSerializer):
    job = ExecutionJobSerializer(read_only=True)
    user_display = serializers.CharField(source='user.username', read_only=True)
    problem_title = serializers.CharField(source='problem.title', read_only=True)

    class Meta:
        model = Submission
        fields = ['id', 'user', 'user_display', 'problem', 'problem_title', 'code', 'status', 'result_summary', 'job', 'created_at', 'updated_at']
        read_only_fields = ['status', 'result_summary', 'job', 'created_at', 'updated_at']
