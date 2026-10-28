from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from .models import Course, Cohort, Module, Lesson, Enrollment, Progress
from submissions.models import Submission
from .serializers import (
    CourseSerializer, CohortSerializer, ModuleSerializer,
    LessonSerializer, EnrollmentSerializer
)
from .permissions import IsStaffOrReadOnly, IsInstructorOrStaff
from drf_spectacular.utils import extend_schema_view, extend_schema, OpenApiExample
import logging

from dimensional.filament import (
    EventDimensions,
    EventVector,
    EventState,
    FilamentDecision,
    FilamentDecisionService,
    default_filament_hooks,
)

logger = logging.getLogger(__name__)

# telemetry SDK (resilient)
from telemetry import sdk as telemetry

from .services import EnrollmentService, CohortLeaderboardService


@extend_schema_view(
    create=extend_schema(
        request=CourseSerializer,
        examples=[
            OpenApiExample(
                'Create Course Example',
                value={
                    'title': 'Introdução à IA',
                    'description': 'Curso prático de introdução à inteligência artificial',
                    'level': 'beginner',
                    'price': '0.00'
                },
            ),
        ],
    ),
    enroll=extend_schema(
        request=EnrollmentSerializer,
        responses={201: EnrollmentSerializer},
        description="Enroll the current user in a course and optionally a cohort."
    )
)
class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsStaffOrReadOnly, IsInstructorOrStaff]

    def get_queryset(self):
        queryset = super().get_queryset()
        level = self.request.query_params.get('level')
        search = self.request.query_params.get('search')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        is_published = self.request.query_params.get('is_published')
        
        if level:
            queryset = queryset.filter(level=level)
        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(description__icontains=search))
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        if is_published is not None:
            queryset = queryset.filter(is_published=is_published.lower() == 'true')
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_courses(self, request):
        """Returns courses the current user is enrolled in."""
        enrollments = Enrollment.objects.filter(user=request.user, is_active=True).select_related('course')
        courses = [e.course for e in enrollments]
        page = self.paginate_queryset(courses)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(courses, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def enroll(self, request, pk=None):
        course = self.get_object()
        correlation_id = request.headers.get('X-Correlation-ID') or request.META.get('HTTP_X_CORRELATION_ID')
        cohort_id = request.data.get('cohort')

        service = EnrollmentService()
        result = service.enroll_user(
            user=request.user,
            course=course,
            cohort_id=cohort_id,
            correlation_id=correlation_id,
        )

        if not result.success:
            return Response(
                {'error': result.message, 'reason': result.message, 'code': result.error_code},
                status=result.status_code,
            )

        if not result.created:
            return Response({'message': result.message}, status=status.HTTP_200_OK)

        serializer = EnrollmentSerializer(result.enrollment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer
    permission_classes = [IsInstructorOrStaff]


class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [IsInstructorOrStaff]


@extend_schema_view(
    create=extend_schema(
        request=CohortSerializer,
        examples=[
            OpenApiExample(
                'Create Cohort Example',
                value={
                    'course': 1,
                    'title': 'Turma 01',
                    'start_date': '2026-01-05',
                    'end_date': '2026-03-05',
                    'capacity': 30,
                    'timezone': 'UTC'
                },
            ),
        ],
    )
)
class CohortViewSet(viewsets.ModelViewSet):
    queryset = Cohort.objects.select_related('course').all()
    serializer_class = CohortSerializer
    permission_classes = [IsStaffOrReadOnly]

    @action(detail=True, methods=['get'], permission_classes=[IsInstructorOrStaff])
    def members(self, request, pk=None):
        cohort = self.get_object()
        enrollments = cohort.enrollments.all()
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsInstructorOrStaff])
    def bulk_enroll(self, request, pk=None):
        """Bulk enroll users by email list."""
        cohort = self.get_object()
        emails = request.data.get('emails', [])
        if not isinstance(emails, list):
            return Response({"error": "Emails field must be a list"}, status=status.HTTP_400_BAD_REQUEST)

        service = EnrollmentService()
        results = service.bulk_enroll_by_emails(cohort, emails)
        return Response(results)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def leaderboard(self, request, pk=None):
        cohort = self.get_object()
        # Check if user is enrolled in this cohort or is staff
        if not request.user.is_staff and not cohort.enrollments.filter(user=request.user).exists():
            return Response({"error": "You must be enrolled in this cohort to see the leaderboard."}, status=status.HTTP_403_FORBIDDEN)

        leaderboard_data = CohortLeaderboardService.calculate_leaderboard(cohort)
        return Response(leaderboard_data)
