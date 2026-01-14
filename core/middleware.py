import uuid
from typing import Callable

from django.utils.deprecation import MiddlewareMixin

from telemetry import sdk as telemetry


class CorrelationIdMiddleware(MiddlewareMixin):
    """Ensure every HTTP request has an X-Correlation-ID and expose it on request.

    Behavior:
    - If `X-Correlation-ID` header present, use it.
    - Else generate one using telemetry SDK conventions (`auto-<uuid>`).
    - Set `request.correlation_id` and `HTTP_X_CORRELATION_ID` in `request.META`.
    - Add `X-Correlation-ID` to response headers.
    """

    HEADER_NAME = 'HTTP_X_CORRELATION_ID'
    RESPONSE_HEADER = 'X-Correlation-ID'

    def process_request(self, request):
        cid = request.META.get(self.HEADER_NAME)
        if not cid:
            # generate using telemetry helper if available to keep prefix consistent
            try:
                payload = {}
                cid = telemetry._ensure_correlation_id(payload)
            except Exception:
                cid = f"auto-{uuid.uuid4().hex}"
        request.correlation_id = cid
        request.META[self.HEADER_NAME] = cid

    def process_response(self, request, response):
        cid = getattr(request, 'correlation_id', None) or request.META.get(self.HEADER_NAME)
        if cid:
            response[self.RESPONSE_HEADER] = cid
        return response
