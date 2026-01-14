from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import models
from .models import Problem, Submission
from .serializers import ProblemSerializer, SubmissionSerializer
from sandbox.models import ExecutionJob
from sandbox.tasks import execute_code_task
from courses.permissions import IsStaffOrReadOnly, IsInstructorOrStaff


class ProblemViewSet(viewsets.ModelViewSet):
    queryset = Problem.objects.all()
    serializer_class = ProblemSerializer
    permission_classes = [IsStaffOrReadOnly, IsInstructorOrStaff]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class SubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Submission.objects.select_related('problem', 'user', 'job')
        if user.is_staff:
            return queryset.all()
        
        user_role = getattr(user, 'role', 'student')
        if user_role == 'teacher':
            # Teachers see submissions for their own problems OR their own submissions
            return queryset.filter(models.Q(problem__owner=user) | models.Q(user=user))
        
        return queryset.filter(user=user)

    def perform_create(self, serializer):
        # create submission and corresponding ExecutionJob with problem test template
        user = self.request.user
        problem = serializer.validated_data['problem']
        code = serializer.validated_data['code']

        # Security: Check if user is enrolled in the course if one is linked to the problem
        if problem.course:
            from courses.models import Enrollment
            if not Enrollment.objects.filter(user=user, course=problem.course, is_active=True).exists():
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You must be enrolled in the course to submit solutions.")

        # prepare combined code by injecting student's code into problem.test_template
        template = problem.test_template or "{student_code}\nprint('No tests defined')"
        combined_code = template.replace('{student_code}', code)

        job = ExecutionJob.objects.create(user=user, code=combined_code, language='python')
        # enqueue execution with time limits based on job.timeout_seconds
        soft = int(getattr(job, 'timeout_seconds', 10))
        hard = soft + 5
        execute_code_task.apply_async((job.id,), soft_time_limit=soft, time_limit=hard)

        submission = serializer.save(user=user, job=job, status=Submission.STATUS_PENDING)
        return submission

    @action(detail=True, methods=['GET'])
    def refresh_status(self, request, pk=None):
        submission = self.get_object()
        # sync submission status with job
        job = submission.job
        if job:
            submission.status = job.status if job.status in [ExecutionJob.STATUS_SUCCESS, ExecutionJob.STATUS_FAILED, ExecutionJob.STATUS_RUNNING, ExecutionJob.STATUS_PENDING] else submission.status
            # summarize results
            submission.result_summary = (job.stdout or '') + '\n' + (job.stderr or '')
            submission.save()
        return Response(SubmissionSerializer(submission).data)
