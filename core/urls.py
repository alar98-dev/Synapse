from django.urls import path
from . import views

urlpatterns = [
    path('', views.healthcheck, name='core-health'),
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
    path('audit/', views.audit_entries, name='audit-entries'),
]
