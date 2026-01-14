from django.test import TestCase, RequestFactory
from django.http import HttpResponse
from core.middleware import CorrelationIdMiddleware


class CorrelationIdMiddlewareTest(TestCase):
    """Unit tests for CorrelationIdMiddleware."""

    def setUp(self):
        self.middleware = CorrelationIdMiddleware(lambda r: HttpResponse())  # Dummy get_response
        self.factory = RequestFactory()

    def test_request_without_correlation_id_generates_new(self):
        """Test that requests without X-Correlation-ID generate a new one."""
        request = self.factory.get('/api/test/')
        self.middleware.process_request(request)

        self.assertTrue(hasattr(request, 'correlation_id'))
        self.assertIsNotNone(request.correlation_id)
        self.assertTrue(request.correlation_id.startswith('auto-'))
        self.assertEqual(request.META['HTTP_X_CORRELATION_ID'], request.correlation_id)

    def test_request_with_existing_correlation_id_uses_it(self):
        """Test that requests with existing X-Correlation-ID use it."""
        cid = 'existing-cid-123'
        request = self.factory.get('/api/test/', HTTP_X_CORRELATION_ID=cid)
        self.middleware.process_request(request)

        self.assertEqual(request.correlation_id, cid)
        self.assertEqual(request.META['HTTP_X_CORRELATION_ID'], cid)

    def test_response_includes_correlation_id_header(self):
        """Test that response includes X-Correlation-ID header."""
        request = self.factory.get('/api/test/')
        self.middleware.process_request(request)

        response = HttpResponse()
        response = self.middleware.process_response(request, response)

        self.assertEqual(response['X-Correlation-ID'], request.correlation_id)