from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import ProblemViewSet, SubmissionViewSet

router = DefaultRouter()
router.register(r'problems', ProblemViewSet, basename='problem')
router.register(r'submissions', SubmissionViewSet, basename='submission')

urlpatterns = [
    path('', include(router.urls)),
]
