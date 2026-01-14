from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, PlanViewSet, SubscriptionViewSet, stripe_webhook

router = DefaultRouter()
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'plans', PlanViewSet, basename='plan')
router.register(r'subscriptions', SubscriptionViewSet, basename='subscription')

urlpatterns = [
    path('webhook/stripe/', stripe_webhook, name='stripe-webhook'),
] + router.urls
