import logging
from dataclasses import dataclass
from typing import Optional, List, Dict, Any, Tuple

from courses.models import Course, Cohort, Enrollment
from dimensional.filament import (
    EventDimensions,
    EventVector,
    EventState,
    FilamentDecision,
    FilamentDecisionService,
    default_filament_hooks,
)
from telemetry import sdk as telemetry

logger = logging.getLogger(__name__)

default_enrollment_filament = FilamentDecisionService(
    hooks=default_filament_hooks(),
    risk_threshold=0.85,
)


@dataclass
class EnrollmentResult:
    success: bool
    enrollment: Optional[Enrollment] = None
    created: bool = False
    message: str = ""
    error_code: Optional[str] = None
    status_code: int = 200


class EnrollmentService:
    """Application Service orchestrating Course & Cohort enrollments following DDD & SOLID."""

    def __init__(self, filament_service: Optional[FilamentDecisionService] = None):
        self.filament_service = filament_service or default_enrollment_filament

    def enroll_user(
        self,
        user: Any,
        course: Course,
        cohort_id: Optional[int] = None,
        correlation_id: Optional[str] = None,
    ) -> EnrollmentResult:
        """Enrolls a user into a course, validating cohort constraints and governance rules."""
        cohort = None
        if cohort_id:
            try:
                cohort = Cohort.objects.get(id=cohort_id, course=course)
            except Cohort.DoesNotExist:
                return EnrollmentResult(
                    success=False,
                    message="Cohort not found for this course",
                    error_code="COHORT_NOT_FOUND",
                    status_code=400,
                )

            if not cohort.enrollment_open:
                return EnrollmentResult(
                    success=False,
                    message="Enrollment for this cohort is closed",
                    error_code="COHORT_CLOSED",
                    status_code=400,
                )

            if cohort.enrollments.count() >= cohort.capacity:
                return EnrollmentResult(
                    success=False,
                    message="Cohort is at full capacity",
                    error_code="COHORT_FULL",
                    status_code=400,
                )

        existing_enrollment = Enrollment.objects.filter(user=user, course=course, is_active=True)
        duplicate_enrollment = existing_enrollment.exists()
        cohort_open = bool(cohort and cohort.enrollment_open)
        cohort_capacity = getattr(cohort, 'capacity', None)
        cohort_populated = cohort.enrollments.count() if cohort else 0
        risk_score = ((cohort_populated + 1) / max(cohort_capacity, 1)) if cohort_capacity else 0.0

        event_dimensions = EventDimensions(
            identidade={
                'user_id': user.id,
                'role': getattr(user, 'role', 'student'),
                'user_active': user.is_active,
                'is_verified': bool(getattr(user, 'email', None)),
            },
            contexto={
                'course_id': course.id,
                'course_active': getattr(course, 'is_published', True),
                'cohort_id': cohort.id if cohort else None,
                'cohort_open': cohort_open or cohort is None,
            },
            dependencia={
                'duplicate': duplicate_enrollment,
                'cohort_locked': not cohort_open,
            },
            risco={
                'capacity': cohort_capacity,
                'current': cohort_populated,
                'score': risk_score,
            },
        )

        enrollment_vector = EventVector(
            name='CourseEnrollment',
            module='courses.services.EnrollmentService.enroll_user',
            story_id='BACKLOG-1234',
            dimensions=event_dimensions,
            payload={
                'course_id': course.id,
                'requested_cohort': cohort_id,
                'caller': user.username,
                'correlation_id': correlation_id,
            },
        )

        # S1a - Intent
        enrollment_vector.advance_state(EventState.S1A)
        telemetry.emit('CourseEnrollment.S1a', {
            'correlation_id': correlation_id,
            'story_id': enrollment_vector.story_id,
            'user_id': user.id,
            'course_id': course.id,
        })

        # S1b - Prepared
        enrollment_vector.advance_state(EventState.S1B)
        telemetry.emit('CourseEnrollment.S1b', {
            'correlation_id': correlation_id,
            'story_id': enrollment_vector.story_id,
            'user_id': user.id,
            'course_id': course.id,
        })

        # S2 - Policy / Filament Decision
        decision_summary = self.filament_service.process(enrollment_vector, EventState.S2)
        telemetry.emit('CourseEnrollment.S2', {
            'correlation_id': correlation_id,
            'story_id': enrollment_vector.story_id,
            'user_id': user.id,
            'course_id': course.id,
            'decision': decision_summary.decision.value,
            'reason': decision_summary.message,
        })

        if decision_summary.decision == FilamentDecision.BLOQUEAR:
            self.filament_service.record_learning(enrollment_vector, decision_summary.message)
            telemetry.emit('CourseEnrollment.S4', {
                'correlation_id': correlation_id,
                'story_id': enrollment_vector.story_id,
                'user_id': user.id,
                'course_id': course.id,
                'decision': decision_summary.decision.value,
                'reason': decision_summary.message,
            })
            return EnrollmentResult(
                success=False,
                message=decision_summary.message or "Filamento bloqueou o enrolamento",
                error_code="BLOCKED_BY_POLICY",
                status_code=400,
            )

        if decision_summary.decision == FilamentDecision.AJUSTAR:
            logger.info(
                'Ajuste sugerido pelo filamento para enrolamento',
                extra={'story_id': enrollment_vector.story_id, 'reason': decision_summary.message},
            )

        # S3 - Persistence
        enrollment, created = Enrollment.objects.get_or_create(
            user=user,
            course=course,
            defaults={'cohort': cohort},
        )

        self.filament_service.log_state(
            enrollment_vector,
            EventState.S3,
            FilamentDecision.ACEITAR,
            f'Matrícula persistida (created={created})',
        )
        telemetry.emit('CourseEnrollment.S3', {
            'correlation_id': correlation_id,
            'story_id': enrollment_vector.story_id,
            'user_id': user.id,
            'course_id': course.id,
            'created': bool(created),
        })

        # S4 - Completion / Learning
        self.filament_service.record_learning(
            enrollment_vector,
            "Aprendizado registrado após persistência",
            FilamentDecision.ACEITAR,
            state=EventState.S4,
        )
        telemetry.emit('CourseEnrollment.S4', {
            'correlation_id': correlation_id,
            'story_id': enrollment_vector.story_id,
            'user_id': user.id,
            'course_id': course.id,
            'decision': FilamentDecision.ACEITAR.value,
        })

        if not created:
            if cohort and enrollment.cohort != cohort:
                enrollment.cohort = cohort
                enrollment.save()
            return EnrollmentResult(
                success=True,
                enrollment=enrollment,
                created=False,
                message="User already enrolled",
                status_code=200,
            )

        return EnrollmentResult(
            success=True,
            enrollment=enrollment,
            created=True,
            message="Enrollment successful",
            status_code=201,
        )

    def bulk_enroll_by_emails(self, cohort: Cohort, emails: List[str]) -> Dict[str, List[str]]:
        """Performs bulk enrollment of multiple users into a cohort by email."""
        from users.models import User

        results: Dict[str, List[str]] = {
            "enrolled": [],
            "not_found": [],
            "already_enrolled": [],
        }

        for email in emails:
            try:
                user = User.objects.get(email=email)
                enrollment, created = Enrollment.objects.get_or_create(
                    user=user,
                    course=cohort.course,
                    defaults={'cohort': cohort},
                )
                if created:
                    results["enrolled"].append(email)
                else:
                    if enrollment.cohort != cohort:
                        enrollment.cohort = cohort
                        enrollment.save()
                        results["enrolled"].append(email)
                    else:
                        results["already_enrolled"].append(email)
            except User.DoesNotExist:
                results["not_found"].append(email)

        return results
