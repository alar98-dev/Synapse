from rest_framework import serializers
from .models import Payment, Plan, Subscription

class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = '__all__'

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['user', 'status', 'created_at']

class SubscriptionSerializer(serializers.ModelSerializer):
    plan_detail = PlanSerializer(source='plan', read_only=True)
    
    class Meta:
        model = Subscription
        fields = '__all__'
