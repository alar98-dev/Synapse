from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssessmentViewSet, CognitiveProfileView

router = DefaultRouter()
router.register(r'sessions', AssessmentViewSet, basename='assessment')

urlpatterns = [
    path('profile/', CognitiveProfileView.as_view(), name='cognitive-profile'),
    path('', include(router.urls)),
]
