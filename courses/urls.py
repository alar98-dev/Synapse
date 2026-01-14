from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import CourseViewSet, CohortViewSet, ModuleViewSet, LessonViewSet

router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'cohorts', CohortViewSet, basename='cohort')
router.register(r'modules', ModuleViewSet, basename='module')
router.register(r'lessons', LessonViewSet, basename='lesson')

urlpatterns = [
    path('', include(router.urls)),
]
