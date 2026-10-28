from typing import List, Dict, Any
from courses.models import Cohort, Progress
from submissions.models import Submission


class CohortLeaderboardService:
    """Calculates student engagement scores and leaderboard rankings within a Cohort."""

    @staticmethod
    def calculate_leaderboard(cohort: Cohort) -> List[Dict[str, Any]]:
        """Aggregates gamification points:

        - 10 points per completed lesson
        - 50 points per successful submission
        Returns a sorted list of student rankings (highest points first).
        """
        members = cohort.enrollments.select_related('user').all()
        leaderboard_data = []

        for enrollment in members:
            user = enrollment.user
            completed_lessons = Progress.objects.filter(
                user=user,
                lesson__module__course=cohort.course,
                is_completed=True,
            ).count()

            successful_submissions = Submission.objects.filter(
                user=user,
                problem__course=cohort.course,
                status='success',
            ).count()

            total_points = (completed_lessons * 10) + (successful_submissions * 50)

            leaderboard_data.append({
                "username": user.username,
                "completed_lessons": completed_lessons,
                "successful_submissions": successful_submissions,
                "total_points": total_points,
                "role": getattr(user, 'role', 'student'),
            })

        leaderboard_data.sort(key=lambda x: x['total_points'], reverse=True)
        return leaderboard_data
