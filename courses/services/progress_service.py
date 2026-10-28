from datetime import date, timedelta
from typing import Any, Optional
from courses.models import Progress


class ProgressService:
    """Application Service calculating pedagogical engagement and consistency metrics."""

    @staticmethod
    def calculate_streak(user: Any, reference_date: Optional[date] = None) -> int:
        """Calculates consecutive days of study (streaks) for a given user.

        - If the user completed a lesson today, the streak continues.
        - If the user hasn't completed a lesson today, but did yesterday, the streak is still active.
        - If there is a gap of more than 1 day without completed lessons, streak is 0.
        """
        if reference_date is None:
            reference_date = date.today()

        completed_dates = set(
            Progress.objects.filter(user=user, is_completed=True)
            .values_list('completed_at__date', flat=True)
        )

        if not completed_dates:
            return 0

        streak = 0
        current_check = reference_date

        # If user hasn't completed an activity today, check if yesterday was completed
        if current_check not in completed_dates:
            current_check = current_check - timedelta(days=1)
            if current_check not in completed_dates:
                return 0

        while current_check in completed_dates:
            streak += 1
            current_check -= timedelta(days=1)

        return streak
