from rest_framework import serializers
from .models import AssessmentSession, EvaluationTurn, CognitiveReport, CognitiveProfile

class EvaluationTurnSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationTurn
        fields = ['id', 'speaker', 'content', 'timestamp', 'inference']

class CognitiveReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = CognitiveReport
        fields = ['score', 'summary', 'dimensions', 'created_at']

class CognitiveProfileSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    convergence_rate = serializers.SerializerMethodField()
    total_sessions = serializers.SerializerMethodField()

    class Meta:
        model = CognitiveProfile
        fields = [
            'id', 'username', 'conceptual_understanding',
            'causal_reasoning', 'transfer_ability', 'error_detection',
            'convergence_rate', 'total_sessions', 'last_updated'
        ]

    def get_convergence_rate(self, obj):
        total = obj.user.assessment_sessions.count()
        if total == 0:
            return 0.0
        converged = obj.user.assessment_sessions.filter(status='converged').count()
        return round((converged / total) * 100, 1)

    def get_total_sessions(self, obj):
        return obj.user.assessment_sessions.count()

class AssessmentSessionSerializer(serializers.ModelSerializer):
    turns = EvaluationTurnSerializer(many=True, read_only=True)
    report = CognitiveReportSerializer(read_only=True)
    user_detail = serializers.SerializerMethodField()
    lesson_title = serializers.ReadOnlyField(source='lesson.title')

    class Meta:
        model = AssessmentSession
        fields = ['id', 'user', 'user_detail', 'lesson', 'lesson_title', 'status', 'needs_human_intervention', 'started_at', 'turns', 'report']
        read_only_fields = ['user', 'status', 'started_at']

    def get_user_detail(self, obj):
        return {
            "username": obj.user.username,
            "email": obj.user.email
        }
