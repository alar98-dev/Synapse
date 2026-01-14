from django.urls import path, include, re_path
from django.contrib import admin
from django.views.generic import TemplateView
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

# Centralização das rotas versionadas (v1)
v1_patterns = ([
    path('core/', include('core.urls')),
    path('auth/', include('users.urls')),
    path('', include('courses.urls')),
    path('sandbox/', include('sandbox.urls')),
    path('', include('submissions.urls')),
    path('cognition/', include('cognition.urls')),
    path('payments/', include('payments.urls')),
], 'v1')

urlpatterns = [
    path('admin/', admin.site.urls),
    # Namespace para isolamento e suporte a reversão de URLs: reverse('v1:app-name')
    path('api/v1/', include(v1_patterns)),

    # --- Hybrid Architecture Integration ---
    # Static Landing Page & Public Docs
    path('', TemplateView.as_view(template_name='landing.html'), name='landing'),
    path('auth/', TemplateView.as_view(template_name='auth.html'), name='auth_static'),
    
    # React SPA Entry Point (/app/*)
    # Serves the index.html from Vite build
    re_path(r'^app/.*$', TemplateView.as_view(template_name='index.html'), name='react_spa'),

    # OpenAPI / Swagger
    path('api/v1/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/v1/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/v1/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
