from typing import Dict, Any, Optional
import uuid
from django.contrib.auth import get_user_model
from courses.models import Course, Lesson, Progress, Certificate

User = get_user_model()


class CertificateService:
    """Domain service responsible for verifying graduation eligibility,

    issuing cryptographic certificates, and providing public verification.
    """

    @staticmethod
    def evaluate_eligibility(user: User, course: Course) -> Dict[str, Any]:
        """Calculates total course lessons vs completed lessons."""
        total_lessons = Lesson.objects.filter(module__course=course).count()

        if total_lessons == 0:
            return {
                "is_eligible": False,
                "progress_percentage": 0.0,
                "total_lessons": 0,
                "completed_lessons": 0,
                "message": "Este curso ainda não possui aulas cadastradas.",
            }

        completed_lessons = Progress.objects.filter(
            user=user,
            lesson__module__course=course,
            is_completed=True,
        ).count()

        progress_percentage = round((completed_lessons / total_lessons) * 100, 1)
        is_eligible = (completed_lessons >= total_lessons)

        return {
            "is_eligible": is_eligible,
            "progress_percentage": progress_percentage,
            "total_lessons": total_lessons,
            "completed_lessons": completed_lessons,
            "message": "Curso concluído com 100% de aproveitamento!" if is_eligible else f"Progresso atual: {progress_percentage}% ({completed_lessons}/{total_lessons} aulas).",
        }

    @classmethod
    def claim_certificate(cls, user: User, course: Course) -> Dict[str, Any]:
        """Evaluates graduation criteria.

        If complete, mints/fetches Certificate.
        """
        # Check if already issued
        existing_cert = Certificate.objects.filter(user=user, course=course).first()
        if existing_cert:
            return {
                "success": True,
                "already_issued": True,
                "certificate_id": str(existing_cert.id_code),
                "issued_at": existing_cert.issued_at.isoformat(),
                "course_title": course.title,
                "student_name": user.get_full_name() or user.username,
                "progress_percentage": 100.0,
            }

        eligibility = cls.evaluate_eligibility(user, course)
        if not eligibility["is_eligible"]:
            return {
                "success": False,
                "already_issued": False,
                "error": "O aluno ainda não concluiu todas as lições obrigatórias.",
                "eligibility": eligibility,
            }

        cert = Certificate.objects.create(user=user, course=course)
        return {
            "success": True,
            "already_issued": False,
            "certificate_id": str(cert.id_code),
            "issued_at": cert.issued_at.isoformat(),
            "course_title": course.title,
            "student_name": user.get_full_name() or user.username,
            "progress_percentage": 100.0,
        }

    @staticmethod
    def verify_certificate(id_code_str: str) -> Dict[str, Any]:
        """Publicly verifies the authenticity of an issued certificate."""
        try:
            cert_uuid = uuid.UUID(str(id_code_str))
            cert = Certificate.objects.select_related('user', 'course').get(id_code=cert_uuid)
            return {
                "valid": True,
                "certificate_id": str(cert.id_code),
                "student_username": cert.user.username,
                "student_name": cert.user.get_full_name() or cert.user.username,
                "course_title": cert.course.title,
                "course_slug": cert.course.slug,
                "issued_at": cert.issued_at.isoformat(),
                "issuer": "Synapse Cognitive Learning Platform",
            }
        except (ValueError, Certificate.DoesNotExist):
            return {
                "valid": False,
                "error": "Certificado não encontrado ou código de validação inválido.",
            }
