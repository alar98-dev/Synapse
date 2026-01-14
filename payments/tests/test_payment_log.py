from django.test import TestCase
from django.contrib.auth import get_user_model
from payments.models import Payment, PaymentLog, Plan
from courses.models import Course
import json

User = get_user_model()


class PaymentLogTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='testpass')
        self.plan = Plan.objects.create(name='Test Plan', slug='test-plan', price=10.00)
        self.course = Course.objects.create(title='Test Course', description='Test', price=50.00, owner=self.user)
        self.payment = Payment.objects.create(
            user=self.user,
            plan=self.plan,
            amount=10.00,
            status='pending'
        )

    def test_payment_log_creation(self):
        """Test creating a PaymentLog entry"""
        log = PaymentLog.objects.create(
            payment=self.payment,
            correlation_id='test-correlation-123',
            level='info',
            message='Test log message',
            metadata={'key': 'value'}
        )
        
        self.assertEqual(log.payment, self.payment)
        self.assertEqual(log.correlation_id, 'test-correlation-123')
        self.assertEqual(log.level, 'info')
        self.assertEqual(log.message, 'Test log message')
        self.assertEqual(log.metadata, {'key': 'value'})

    def test_payment_log_without_payment(self):
        """Test creating a PaymentLog without associated payment"""
        log = PaymentLog.objects.create(
            correlation_id='test-correlation-456',
            level='error',
            message='Webhook error',
            metadata={'error': 'invalid signature'}
        )
        
        self.assertIsNone(log.payment)
        self.assertEqual(log.level, 'error')
        self.assertEqual(log.message, 'Webhook error')

    def test_payment_log_ordering(self):
        """Test that logs are ordered by created_at descending"""
        log1 = PaymentLog.objects.create(
            payment=self.payment,
            correlation_id='corr-1',
            level='info',
            message='First log'
        )
        log2 = PaymentLog.objects.create(
            payment=self.payment,
            correlation_id='corr-2',
            level='info',
            message='Second log'
        )
        
        logs = PaymentLog.objects.filter(payment=self.payment)
        self.assertEqual(logs.first(), log2)  # Most recent first
        self.assertEqual(logs.last(), log1)   # Oldest last

    def test_payment_log_str_representation(self):
        """Test string representation of PaymentLog"""
        log = PaymentLog.objects.create(
            payment=self.payment,
            correlation_id='corr-1',
            level='warning',
            message='This is a very long message that should be truncated in str representation'
        )
        
        str_repr = str(log)
        self.assertIn('PaymentLog', str_repr)
        self.assertIn('warning', str_repr)
        self.assertIn('This is a very long message', str_repr)
        self.assertNotIn('that should be truncated', str_repr)  # Should be truncated