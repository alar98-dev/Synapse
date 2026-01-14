from django.db.models.signals import post_save
from django.dispatch import receiver
from submissions.models import Submission
from .models import Progress, Lesson, Certificate, Course

@receiver(post_save, sender=Submission)
def update_progress_on_submission(sender, instance, created, **kwargs):
    """
    When a submission is successful, mark the corresponding lesson as completed.
    """
    if instance.status == Submission.STATUS_SUCCESS:
        problem = instance.problem
        if problem.lesson:
            progress, created = Progress.objects.get_or_create(
                user=instance.user,
                lesson=problem.lesson,
                defaults={'is_completed': True}
            )
            if not progress.is_completed:
                progress.is_completed = True
                progress.save()
            
            # Check if course is completed
            check_course_completion(instance.user, problem.lesson.module.course)

def check_course_completion(user, course):
    """
    Check if a user has completed all lessons in a course.
    If so, issue a certificate.
    """
    total_lessons = Lesson.objects.filter(module__course=course).count()
    completed_lessons = Progress.objects.filter(
        user=user, 
        lesson__module__course=course, 
        is_completed=True
    ).count()

    if total_lessons > 0 and completed_lessons >= total_lessons:
        # Issue certificate if not already issued
        Certificate.objects.get_or_create(user=user, course=course)
