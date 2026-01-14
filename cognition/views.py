from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from .models import AssessmentSession
from .serializers import AssessmentSessionSerializer
from .engine import CognitiveOrchestrator
from courses.permissions import IsStaffOrTeacher
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes


@extend_schema(tags=['cognition'])
class AssessmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'llm_respond'

    def get_queryset(self):
        user = self.request.user
        queryset = AssessmentSession.objects.all()
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        if user.is_staff or getattr(user, 'role', None) in ['teacher', 'staff']:
            return queryset
        return queryset.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @extend_schema(
        request=OpenApiTypes.OBJECT,
        responses={200: OpenApiTypes.OBJECT},
        description="Submit a student response to the cognitive session and get LLM feedback."
    )
    @action(detail=True, methods=['post'])
    def respond(self, request, pk=None):
        session = self.get_object()
        if session.status != 'active':
            return Response({"error": "This session is no longer active."}, status=status.HTTP_400_BAD_REQUEST)

        student_text = request.data.get('content')
        if not student_text:
            return Response({"error": "Content is required."}, status=status.HTTP_400_BAD_REQUEST)

        orchestrator = CognitiveOrchestrator(session)
        llm_response = orchestrator.process_student_response(student_text)

        return Response({
            "llm_response": llm_response,
            "session_status": session.status
        })

    @action(detail=False, methods=['post'])
    def probe(self, request):
        """Test endpoint to probe LLM connectors with a prompt. Returns raw LLM response."""
        if not request.user or not request.user.is_authenticated or not request.user.is_staff:
            return Response({"error": "Staff authentication required"}, status=status.HTTP_403_FORBIDDEN)

        prompt = request.data.get('prompt')
        provider = request.data.get('provider')
        model = request.data.get('model')
        if not prompt:
            return Response({"error": "prompt is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from .llm_connector import LLMClient
            client = LLMClient(provider=provider)
            resp = client.execute("", prompt, model=model)
            return Response({"ok": True, "response": resp})
        except Exception as e:
            return Response({"ok": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], permission_classes=[IsStaffOrTeacher])
    def stats(self, request):
        """Returns aggregated metrics about cognitive assessments."""
        from django.db.models import Avg, Count
        from .models import CognitiveReport
        
        total_sessions = AssessmentSession.objects.count()
        converged_sessions = AssessmentSession.objects.filter(status='converged').count()
        avg_score = CognitiveReport.objects.aggregate(avg=Avg('score'))['avg'] or 0
        
        # Breakdown by lesson
        lesson_stats = AssessmentSession.objects.values('lesson__title').annotate(
            count=Count('id'),
            avg_score=Avg('report__score')
        ).order_by('-count')

        return Response({
            "overview": {
                "total_sessions": total_sessions,
                "converged_sessions": converged_sessions,
                "convergence_rate": (converged_sessions / total_sessions) if total_sessions > 0 else 0,
                "average_score": avg_score,
            },
            "lesson_breakdown": lesson_stats
        })
