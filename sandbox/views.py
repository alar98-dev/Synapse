from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import ExecutionJob
from .serializers import ExecutionJobSerializer, ExecuteCodeSerializer
from .tasks import execute_code_task
from .executor import get_executor
from django.utils import timezone


class SubmitCodeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = 'submit_code'
    # Provide input serializer so schema generation can infer request body
    serializer_class = ExecuteCodeSerializer

    def post(self, request):
        serializer = ExecuteCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data['code']
        language = serializer.validated_data.get('language', 'python')

        job = ExecutionJob.objects.create(user=request.user, code=code, language=language)
        # enqueue job with soft/hard time limits using job.timeout_seconds
        soft = int(getattr(job, 'timeout_seconds', 10))
        hard = soft + 5
        execute_code_task.apply_async((job.id,), soft_time_limit=soft, time_limit=hard)

        return Response(ExecutionJobSerializer(job).data, status=status.HTTP_201_CREATED)


class JobDetailView(generics.RetrieveAPIView):
    queryset = ExecutionJob.objects.all()
    serializer_class = ExecutionJobSerializer
    permission_classes = [permissions.IsAuthenticated]


class CancelJobView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    # No request body, but expose an output serializer to help schema tools
    serializer_class = ExecutionJobSerializer

    def post(self, request, pk):
        try:
            job = ExecutionJob.objects.get(pk=pk)
        except ExecutionJob.DoesNotExist:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        if not job.container_id:
            return Response({'detail': 'No running container for this job'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            executor = get_executor()
            canceled = executor.cancel(job.container_id)
            job.status = ExecutionJob.STATUS_CANCELED
            job.finished_at = timezone.now()
            job.save()

            # Update any related Submission immediately
            try:
                from submissions.models import Submission
                subs_qs = Submission.objects.filter(job=job)
                for sub in subs_qs:
                    sub.status = Submission.STATUS_CANCELED
                    sub.result_summary = (job.stdout or '') + '\n' + (job.stderr or '') + '\n' + 'Canceled by user'
                    sub.save()
            except Exception:
                # don't block cancel if submission update fails
                pass

            # clear container id
            job.container_id = None
            job.save()
            return Response({'detail': 'Job canceled' if canceled else 'Job marked canceled (no container action)'})
        except Exception as e:
            return Response({'detail': f'Failed to cancel: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
