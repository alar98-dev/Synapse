from django.urls import path
from .views import SubmitCodeView, JobDetailView, CancelJobView

urlpatterns = [
    path('submit/', SubmitCodeView.as_view(), name='sandbox-submit'),
    path('jobs/<int:pk>/', JobDetailView.as_view(), name='sandbox-job-detail'),
    path('jobs/<int:pk>/cancel/', CancelJobView.as_view(), name='sandbox-job-cancel'),
]
