from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from payments.models import Payment, PaymentLog, Plan
from payments.views import stripe_webhook
from courses.models import Course
import json
from unittest.mock import patch

User = get_user_model()


class WebhookLoggingTestCase(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='testpass')
        self.plan = Plan.objects.create(name='Test Plan', slug='test-plan', price=10.00)
        self.course = Course.objects.create(title='Test Course', description='Test', price=50.00, owner=self.user)
        self.payment = Payment.objects.create(
            user=self.user,
            plan=self.plan,
            amount=10.00,
            status='pending'
        )

    def test_webhook_logging_invalid_payload(self):
        """Test logging for invalid webhook payload"""
        request = self.factory.post(
            '/payments/webhook/',
            data='invalid json',
            content_type='application/json',
            HTTP_X_CORRELATION_ID='test-correlation-999',
            HTTP_STRIPE_SIGNATURE='test_sig'
        )

        response = stripe_webhook(request)
        self.assertEqual(response.status_code, 400)

        # Check error log was created
        error_log = PaymentLog.objects.filter(
            correlation_id='test-correlation-999',
            level='error',
            message='Invalid webhook payload'
        ).first()
        self.assertIsNotNone(error_log)

    def test_webhook_logging_invalid_signature(self):
        """Test logging for invalid webhook signature"""
        request = self.factory.post(
            '/payments/webhook/',
            data=json.dumps({'type': 'test'}),
            content_type='application/json',
            HTTP_X_CORRELATION_ID='test-correlation-888',
            HTTP_STRIPE_SIGNATURE='invalid_sig'
        )

        # Mock stripe to raise ValueError for invalid signature
        with patch('stripe.Webhook.construct_event', side_effect=ValueError('Invalid signature')):
            response = stripe_webhook(request)
            self.assertEqual(response.status_code, 400)

        # Check error log was created
        error_log = PaymentLog.objects.filter(
            correlation_id='test-correlation-888',
            level='error',
            message='Invalid webhook signature'
        ).first()
        self.assertIsNotNone(error_log)

    def test_webhook_logging_received(self):
        """Test logging when webhook is received successfully"""
        mock_event = {
            'type': 'unknown.event',
            'id': 'evt_test123',
            'data': {'object': {}}
        }
        
        request = self.factory.post(
            '/payments/webhook/',
            data=json.dumps(mock_event),
            content_type='application/json',
            HTTP_X_CORRELATION_ID='test-correlation-777',
            HTTP_STRIPE_SIGNATURE='test_sig'
        )

        # Mock stripe to return the event
        with patch('stripe.Webhook.construct_event', return_value=mock_event):
            response = stripe_webhook(request)
            self.assertEqual(response.status_code, 200)

        # Check webhook received log was created
        received_log = PaymentLog.objects.filter(
            correlation_id='test-correlation-777',
            level='info',
            message__icontains='Webhook received'
        ).first()
        self.assertIsNotNone(received_log)
        self.assertEqual(received_log.metadata['event_type'], 'unknown.event')