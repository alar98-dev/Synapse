from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.throttling import ScopedRateThrottle
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from .models import Payment, Plan, Subscription, PaymentLog
from .serializers import PaymentSerializer, PlanSerializer, SubscriptionSerializer
import stripe
import logging
from telemetry import sdk as telemetry
from drf_spectacular.utils import extend_schema

logger = logging.getLogger(__name__)

from dimensional.filament import (
    EventDimensions,
    EventVector,
    EventState,
    FilamentDecision,
)
from dimensional.service import get_filament_service

# centralized filament for payments
payment_filament = get_filament_service('payments')

stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', None)

class PlanViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer
    permission_classes = [permissions.AllowAny]

class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'create_checkout'

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def create_checkout_session(self, request):
        course_id = request.data.get('course_id')
        plan_id = request.data.get('plan_id')
        
        name = "Synapse Purchase"
        amount = 0
        
        # Filament validation before creating payment
        event_dims = EventDimensions(
            identidade={
                'user_id': request.user.id,
                'role': getattr(request.user, 'role', 'student'),
                'user_active': request.user.is_active,
            },
            contexto={
                'course_id': course_id,
                'plan_id': plan_id,
            },
            dependencia={},
            risco={'score': 0.0},
        )
        ev = EventVector(
            name='CreateCheckout',
            module='payments.create_checkout_session',
            story_id='PAYCHECKOUT-1',
            dimensions=event_dims,
            payload={'course_id': course_id, 'plan_id': plan_id, 'caller': request.user.username},
        )
        ev.advance_state(EventState.S1A)
        ev.advance_state(EventState.S1B)
        decision = payment_filament.process(ev, EventState.S2)
        telemetry.emit('Payment.S2.filament', {
            'user_id': request.user.id,
            'course_id': course_id,
            'plan_id': plan_id,
            'decision': decision.decision.value,
            'reason': decision.message,
        })
        if decision.decision == FilamentDecision.BLOQUEAR:
            payment = Payment.objects.create(user=request.user, status='blocked', amount=0)
            payment.save()
            payment_filament.record_learning(ev, decision.message, FilamentDecision.BLOQUEAR, state=EventState.S4)
            return Response({'error': 'Filament blocked payment', 'reason': decision.message}, status=status.HTTP_400_BAD_REQUEST)

        payment = Payment.objects.create(
            user=request.user,
            status='pending',
            amount=0
        )
        
        if course_id:
            from courses.models import Course
            try:
                course = Course.objects.get(id=course_id)
                payment.course = course
                amount = int(course.price * 100)
                name = course.title
            except Course.DoesNotExist:
                return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
        elif plan_id:
            try:
                plan = Plan.objects.get(id=plan_id)
                payment.plan = plan
                amount = int(plan.price * 100)
                name = plan.name
            except Plan.DoesNotExist:
                return Response({'error': 'Plan not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'error': 'course_id or plan_id required'}, status=status.HTTP_400_BAD_REQUEST)
            
        payment.amount = amount / 100
        payment.save()
        
        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {'name': name},
                        'unit_amount': amount,
                    },
                    'quantity': 1,
                }],
                mode='payment' if course_id else 'subscription',
                success_url=request.build_absolute_uri('/') + '?payment_status=success',
                cancel_url=request.build_absolute_uri('/') + '?payment_status=cancel',
                client_reference_id=str(payment.id),
                customer_email=request.user.email,
            )
            return Response({'id': checkout_session.id, 'url': checkout_session.url})
        except Exception as e:
            logger.error(f"Stripe checkout error: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class SubscriptionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Subscription.objects.filter(user=self.request.user)


@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@extend_schema(
    description='Stripe webhook receiver. Filament validates external events before processing.',
    responses={200: None, 400: None},
)
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    endpoint_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', None)
    correlation_id = request.META.get('HTTP_X_CORRELATION_ID', 'unknown')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError:
        PaymentLog.objects.create(
            correlation_id=correlation_id,
            level='error',
            message='Invalid webhook payload',
            metadata={'sig_header': sig_header, 'endpoint_secret': bool(endpoint_secret)}
        )
        return Response(status=status.HTTP_400_BAD_REQUEST)
    except stripe.error.SignatureVerificationError:
        PaymentLog.objects.create(
            correlation_id=correlation_id,
            level='error',
            message='Invalid webhook signature',
            metadata={'sig_header': sig_header}
        )
        return Response(status=status.HTTP_400_BAD_REQUEST)

    # Log webhook received
    PaymentLog.objects.create(
        correlation_id=correlation_id,
        level='info',
        message=f'Webhook received: {event["type"]}',
        metadata={'event_type': event['type'], 'event_id': event['id']}
    )

    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        # Filament validation for external payment event
        client_reference_id = session.get('client_reference_id') or session.get('client_reference_id')
        billing_score = 0.0
        payment_obj = None
        try:
            if client_reference_id:
                payment_obj = Payment.objects.get(id=client_reference_id)
                # simple billing_history heuristic
                all_payments = Payment.objects.filter(user=payment_obj.user).exclude(id=payment_obj.id)
                total = all_payments.count()
                failures = all_payments.filter(status__in=['failed', 'blocked']).count()
                billing_score = (failures / total) if total > 0 else 0.0
        except Payment.DoesNotExist:
            payment_obj = None

        event_dims = EventDimensions(
            identidade={'customer_email': session.get('customer_email')},
            contexto={'external_id': session.get('id'), 'mode': session.get('mode')},
            dependencia={'client_reference_id': client_reference_id},
            risco={'billing_history_score': billing_score, 'amount': session.get('amount_total') or session.get('amount') or 0},
        )
        ev = EventVector(name='StripeCheckoutCompleted', module='payments.stripe_webhook', story_id=f"stripe-{session.get('id')}", dimensions=event_dims, payload=dict(session))
        ev.advance_state(EventState.S1A)
        ev.advance_state(EventState.S1B)
        decision = payment_filament.process(ev, EventState.S2)
        telemetry.emit('Payment.Webhook.S2.filament', {
            'external_id': session.get('id'),
            'client_reference_id': client_reference_id,
            'decision': decision.decision.value,
            'reason': decision.message,
        })
        # Log filament decision
        PaymentLog.objects.create(
            payment=payment_obj,
            correlation_id=correlation_id,
            level='warning' if decision.decision == FilamentDecision.BLOQUEAR else 'info',
            message=f'Filament decision for webhook: {decision.decision.value}',
            metadata={'decision': decision.decision.value, 'reason': decision.message, 'external_id': session.get('id')}
        )
        if decision.decision == FilamentDecision.BLOQUEAR:
            # mark payment blocked if we could find it
            if payment_obj:
                payment_obj.status = 'blocked'
                payment_obj.save()
            payment_filament.record_learning(ev, decision.message, FilamentDecision.BLOQUEAR, state=EventState.S4)
            telemetry.emit('Payment.Webhook.S4.blocked', {'external_id': session.get('id'), 'reason': decision.message})
            PaymentLog.objects.create(
                payment=payment_obj,
                correlation_id=correlation_id,
                level='critical',
                message='Payment blocked by filament',
                metadata={'external_id': session.get('id'), 'reason': decision.message}
            )
            return Response(status=status.HTTP_200_OK)
        # if AJUSTAR we let normal processing continue but log
        if decision.decision == FilamentDecision.AJUSTAR:
            logger.info('Filament suggested adjustment for webhook event: %s', decision.message)
            PaymentLog.objects.create(
                payment=payment_obj,
                correlation_id=correlation_id,
                level='warning',
                message=f'Filament adjustment suggested: {decision.message}',
                metadata={'external_id': session.get('id'), 'reason': decision.message}
            )

        handle_checkout_session(session)
    elif event['type'] == 'invoice.paid':
        invoice = event['data']['object']
        PaymentLog.objects.create(
            correlation_id=correlation_id,
            level='info',
            message=f'Invoice paid webhook received: {invoice.get("id")}',
            metadata={'invoice_id': invoice.get('id'), 'customer_id': invoice.get('customer'), 'amount': invoice.get('amount_paid')}
        )
        handle_invoice_paid(invoice)

    return Response(status=status.HTTP_200_OK)


def handle_checkout_session(session):
    external_id = session.get('id')
    client_reference_id = session.get('client_reference_id')
    correlation_id = 'webhook-' + external_id  # Generate correlation_id for webhook processing
    
    try:
        payment = Payment.objects.get(id=client_reference_id)
        payment.status = 'completed'
        payment.external_id = external_id
        payment.save()

        PaymentLog.objects.create(
            payment=payment,
            correlation_id=correlation_id,
            level='info',
            message='Payment completed successfully',
            metadata={'external_id': external_id, 'amount': payment.amount, 'user': payment.user.username}
        )

        # If it's a plan subscription, create the subscription
        if payment.plan:
            Subscription.objects.get_or_create(
                user=payment.user,
                plan=payment.plan,
                defaults={'is_active': True}
            )
            PaymentLog.objects.create(
                payment=payment,
                correlation_id=correlation_id,
                level='info',
                message=f'Subscription created for plan {payment.plan.name}',
                metadata={'plan': payment.plan.name, 'user': payment.user.username}
            )
        
        # If it's a course purchase, enroll the user
        if payment.course:
            from courses.models import Enrollment
            Enrollment.objects.get_or_create(
                user=payment.user,
                course=payment.course,
                defaults={'is_active': True}
            )
            logger.info(f"User {payment.user.username} enrolled in course {payment.course.title} after payment")
            PaymentLog.objects.create(
                payment=payment,
                correlation_id=correlation_id,
                level='info',
                message=f'User enrolled in course {payment.course.title}',
                metadata={'course': payment.course.title, 'user': payment.user.username}
            )

    except Payment.DoesNotExist:
        logger.error(f"Payment {client_reference_id} not found during webhook")
        PaymentLog.objects.create(
            correlation_id=correlation_id,
            level='error',
            message=f'Payment {client_reference_id} not found during webhook processing',
            metadata={'external_id': external_id, 'client_reference_id': client_reference_id}
        )


def handle_invoice_paid(invoice):
    customer_id = invoice.get('customer')
    subscription_id = invoice.get('subscription')
    correlation_id = 'invoice-' + invoice.get('id', 'unknown')
    
    # In a real app, we'd lookup user by stripe customer_id
    # For now, let's assume we can map them
    logger.info(f"Subscription invoice paid: {subscription_id} for customer {customer_id}")
    PaymentLog.objects.create(
        correlation_id=correlation_id,
        level='info',
        message=f'Subscription invoice paid for customer {customer_id}',
        metadata={'customer_id': customer_id, 'subscription_id': subscription_id, 'invoice_id': invoice.get('id'), 'amount': invoice.get('amount_paid')}
    )
    # Update Subscription expiry or active status if needed

class SubscriptionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Subscription.objects.filter(user=self.request.user).select_related('plan')
