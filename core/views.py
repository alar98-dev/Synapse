from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from courses.models import Course, Lesson, Material
from users.models import User
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import AuditEntry
from .serializers import AuditEntrySerializer

@extend_schema(responses={200: {"properties": {"status": {"type": "string"}}}})
@api_view(['GET'])
@permission_classes([AllowAny])
def healthcheck(request):
    return Response({'status': 'ok'})

@extend_schema(responses={200: {
    "properties": {
        "active_courses": {"type": "integer"},
        "total_students": {"type": "integer"},
        "total_materials": {"type": "integer"},
        "lessons_today": {"type": "integer"}
    }
}})
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    # Stats for the instructor dashboard
    active_courses = Course.objects.filter(is_published=True).count()
    total_students = User.objects.filter(role='student').count()
    total_materials = Material.objects.count()
    
    # Just as a placeholder for "lessons today", let's count lessons created today
    today = timezone.now().date()
    lessons_today = Lesson.objects.filter(created_at__date=today).count()
    
    return Response({
        'active_courses': active_courses,
        'total_students': total_students,
        'total_materials': total_materials,
        'lessons_today': lessons_today,
    })


@extend_schema(responses={200: AuditEntrySerializer(many=True)})
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def audit_entries(request):
    """List audit entries. Can be filtered by `correlation_id` query param.

    Example: GET /api/v1/core/audit/?correlation_id=abc-123
    """
    correlation_id = request.query_params.get('correlation_id')
    qs = AuditEntry.objects.all().order_by('-timestamp')
    if correlation_id:
        qs = qs.filter(correlation_id=correlation_id)
    
    qs = qs[:100]
    serializer = AuditEntrySerializer(qs, many=True)
    return Response(serializer.data)
