from typing import Dict, Any, Optional
from django.contrib.auth import get_user_model
from django.db.models import Avg
from cognition.models import CognitiveProfile, AssessmentSession, CognitiveReport
from submissions.models import Submission

User = get_user_model()


class CognitiveProfilingService:
    """Domain service responsible for calculating, updating and aggregating

    the learner's multidimensional cognitive metrics.
    """

    @classmethod
    def get_profile(cls, user: User) -> CognitiveProfile:
        """Retrieves or creates the user's cognitive profile."""
        profile, created = CognitiveProfile.objects.get_or_create(user=user)
        if created or (profile.conceptual_understanding == 0.0 and profile.causal_reasoning == 0.0):
            return cls.recalculate_profile(user)
        return profile

    @classmethod
    def recalculate_profile(cls, user: User) -> CognitiveProfile:
        """Aggregates scores across all assessment sessions, cognitive reports,

        and hands-on code sandbox submissions.
        """
        profile, _ = CognitiveProfile.objects.get_or_create(user=user)

        reports = CognitiveReport.objects.filter(session__user=user)
        total_reports = reports.count()

        # Default baseline scores if new learner
        conceptual = 75.0
        causal = 70.0
        transfer = 65.0
        error_det = 80.0

        if total_reports > 0:
            c_scores = []
            r_scores = []
            t_scores = []
            e_scores = []

            for r in reports:
                dims = r.dimensions or {}
                # Score can be 0.0-1.0 or 0-100
                raw_c = dims.get('conceptual_understanding', r.score)
                raw_r = dims.get('causal_reasoning', r.score)
                raw_t = dims.get('transfer_ability', r.score)
                raw_e = dims.get('error_detection', r.score)

                # Normalize to 0-100%
                c_scores.append(raw_c * 100 if raw_c <= 1.0 else raw_c)
                r_scores.append(raw_r * 100 if raw_r <= 1.0 else raw_r)
                t_scores.append(raw_t * 100 if raw_t <= 1.0 else raw_t)
                e_scores.append(raw_e * 100 if raw_e <= 1.0 else raw_e)

            conceptual = sum(c_scores) / len(c_scores)
            causal = sum(r_scores) / len(r_scores)
            transfer = sum(t_scores) / len(t_scores)
            error_det = sum(e_scores) / len(e_scores)

        # Factor in hands-on sandbox submissions
        total_submissions = Submission.objects.filter(user=user).count()
        successful_submissions = Submission.objects.filter(user=user, status='success').count()

        if total_submissions > 0:
            accuracy_rate = (successful_submissions / total_submissions) * 100
            # Blend error detection with sandbox bug-fixing performance (60% weight on actual code tests)
            error_det = round((error_det * 0.4) + (accuracy_rate * 0.6), 1)
            conceptual = round(min(100.0, conceptual + (successful_submissions * 1.5)), 1)

        # Session convergence bonus
        converged_count = AssessmentSession.objects.filter(user=user, status='converged').count()
        if converged_count > 0:
            causal = round(min(100.0, causal + (converged_count * 2.0)), 1)
            transfer = round(min(100.0, transfer + (converged_count * 2.5)), 1)

        profile.conceptual_understanding = round(min(100.0, max(0.0, conceptual)), 1)
        profile.causal_reasoning = round(min(100.0, max(0.0, causal)), 1)
        profile.transfer_ability = round(min(100.0, max(0.0, transfer)), 1)
        profile.error_detection = round(min(100.0, max(0.0, error_det)), 1)
        profile.save()

        return profile
