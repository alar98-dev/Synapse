import time
import logging
from datetime import datetime
from celery import shared_task
from celery.exceptions import SoftTimeLimitExceeded
from django.utils import timezone
from .models import ExecutionJob
from .executor import get_executor
from telemetry import sdk as telemetry
from dimensional.filament import (
    EventDimensions,
    EventVector,
    EventState,
    FilamentDecision,
)
from dimensional.service import get_filament_service

logger = logging.getLogger(__name__)

# Filament service for sandbox job gating (centralized)
sandbox_filament = get_filament_service('sandbox')


@shared_task(bind=True)
def execute_code_task(self, job_id):
    try:
        job = ExecutionJob.objects.get(pk=job_id)
    except ExecutionJob.DoesNotExist:
        return

    job.status = ExecutionJob.STATUS_RUNNING
    job.started_at = timezone.now()
    job.save()

    # Build event vector for filament validation before execution
    event_dimensions = EventDimensions(
        identidade={
            'user_id': job.user.id if job.user else None,
            'user_active': bool(getattr(job.user, 'is_active', True)),
            'role': getattr(job.user, 'role', 'student') if job.user else 'anonymous',
        },
        contexto={
            'language': getattr(job, 'language', 'python'),
            'job_id': job.id,
            'timeout': getattr(job, 'timeout_seconds', None),
        },
        dependencia={
            'submission_id': getattr(job, 'submission_id', None),
        },
        risco={
            'estimated_duration': getattr(job, 'estimated_duration', 0),
            'score': 0.0,
        },
    )

    job_vector = EventVector(
        name='ExecutionJob',
        module='sandbox.execute_code_task',
        story_id=f'EXEC-{job.id}',
        dimensions=event_dimensions,
        payload={'job_id': job.id, 'language': job.language},
    )
    job_vector.advance_state(EventState.S1A)

    # S1B: preliminary checks
    job_vector.advance_state(EventState.S1B)

    decision_summary = sandbox_filament.process(job_vector, EventState.S2)
    telemetry.emit('ExecutionJob.S2.filament', {
        'job_id': job.id,
        'decision': decision_summary.decision.value,
        'reason': decision_summary.message,
        'correlation_id': getattr(job, 'correlation_id', None),
    })

    if decision_summary.decision == FilamentDecision.BLOQUEAR:
        job.status = ExecutionJob.STATUS_CANCELED
        job.stderr = f"Filament blocked execution: {decision_summary.message}"
        job.finished_at = timezone.now()
        job.save()
        sandbox_filament.record_learning(job_vector, decision_summary.message, FilamentDecision.BLOQUEAR, state=EventState.S4)
        telemetry.emit('ExecutionJob.S4', {
            'job_id': job.id,
            'status': job.status,
            'reason': decision_summary.message,
            'correlation_id': getattr(job, 'correlation_id', None),
        })
        return
    if decision_summary.decision == FilamentDecision.AJUSTAR:
        # Simple adjustment: reduce timeout conservatively
        try:
            timeout = int(getattr(job, 'timeout_seconds', 10) or 10)
            timeout = max(1, timeout // 2)
            setattr(job, 'timeout_seconds', timeout)
            job.save()
        except Exception:
            pass

    # Emit S2: job started/running
    telemetry.emit('ExecutionJob.S2.running', {
        'job_id': job.id,
        'user_id': job.user.id if job.user else None,
        'language': job.language,
        'correlation_id': getattr(job, 'correlation_id', None),
    })

    start = time.time()
    code = job.code

    # Respect job.timeout_seconds (used as soft limit when task enqueued)
    timeout = int(getattr(job, 'timeout_seconds', 10) or 10)

    executor = get_executor()
    container_id = None
    try:
        # Run code via executor (DockerExecutor or LocalExecutor)
        result = executor.run_code(code=code, language=getattr(job, 'language', 'python'), timeout=timeout)
        container_id = result.get('container_id')

        job.container_id = container_id
        job.stdout = result.get('stdout') or ''
        job.stderr = result.get('stderr') or ''
        job.exit_code = result.get('exit_code') if result.get('exit_code') is not None else -1
        job.status = ExecutionJob.STATUS_SUCCESS if job.exit_code == 0 else ExecutionJob.STATUS_FAILED
        # Emit S2: job finished (success/fail)
        telemetry.emit('ExecutionJob.S2.finished', {
            'job_id': job.id,
            'user_id': job.user.id if job.user else None,
            'exit_code': job.exit_code,
            'duration': result.get('duration'),
            'correlation_id': getattr(job, 'correlation_id', None),
        })

    except SoftTimeLimitExceeded:
        # Celery soft time limit exceeded — attempt to cancel execution via executor
        try:
            if container_id:
                executor.cancel(container_id)
        except Exception:
            pass
        job.stderr = f"Execution timed out after {timeout} seconds (soft time limit exceeded)"
        job.status = ExecutionJob.STATUS_CANCELED
        job.exit_code = -1
        telemetry.emit('ExecutionJob.S2.timeout', {
            'job_id': job.id,
            'user_id': job.user.id if job.user else None,
            'timeout': timeout,
            'correlation_id': getattr(job, 'correlation_id', None),
        })
    except Exception as e:
        # Generic errors from executor
        try:
            if container_id:
                executor.cancel(container_id)
        except Exception:
            pass
        job.stderr = str(e)
        job.status = ExecutionJob.STATUS_FAILED
    finally:
        job.finished_at = timezone.now()
        job.duration = time.time() - start
        job.save()
        # Emit S4 audit of job lifecycle
        telemetry.emit('ExecutionJob.S4', {
            'job_id': job.id,
            'user_id': job.user.id if job.user else None,
            'status': job.status,
            'exit_code': job.exit_code,
            'duration': job.duration,
            'correlation_id': getattr(job, 'correlation_id', None),
        })
        # Try to update any Submission linked to this ExecutionJob
        try:
            # import dynamically to avoid circular imports
            from submissions.models import Submission, SubmissionLog
            from submissions.parsers import parse_python_unittest

            subs_qs = Submission.objects.filter(job=job)
            # Persist execution logs for audit: stdout/stderr per submission
            for sub in subs_qs:
                cid = sub.correlation_id or getattr(job, 'correlation_id', None)
                try:
                    if job.stdout:
                        SubmissionLog.objects.create(
                            submission=sub,
                            job=job,
                            correlation_id=cid,
                            level='stdout',
                            message=job.stdout,
                            metadata={'exit_code': job.exit_code, 'duration': job.duration},
                        )
                    if job.stderr:
                        SubmissionLog.objects.create(
                            submission=sub,
                            job=job,
                            correlation_id=cid,
                            level='stderr',
                            message=job.stderr,
                            metadata={'exit_code': job.exit_code, 'duration': job.duration},
                        )
                except Exception:
                    logger.exception('Failed to persist SubmissionLog for submission %s job %s', sub.id, job.id)
            for sub in subs_qs:
                # Map ExecutionJob status to Submission status
                if job.status == ExecutionJob.STATUS_SUCCESS:
                    sub.status = Submission.STATUS_SUCCESS
                elif job.status == ExecutionJob.STATUS_FAILED:
                    sub.status = Submission.STATUS_FAILED
                elif job.status == ExecutionJob.STATUS_RUNNING:
                    sub.status = Submission.STATUS_RUNNING
                else:
                    sub.status = Submission.STATUS_PENDING

                # Parsing results
                parsed = parse_python_unittest(job.stdout or '', job.stderr or '')
                sub.result_summary = parsed.get('summary', (job.stdout or '') + '\n' + (job.stderr or ''))
                sub.score = parsed.get('score', 0.0)
                
                # If tests failed, mark submission as failed even if exit code was 0 (unlikely but possible)
                if not parsed.get('success', True) and sub.status == Submission.STATUS_SUCCESS:
                    sub.status = Submission.STATUS_FAILED
                
                sub.save()
        except Exception as e:
            logger.exception('Failed to update Submission for job %s: %s', job.id, e)
