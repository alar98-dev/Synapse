from typing import Optional
from django.conf import settings
from .filament import FilamentDecisionService, default_filament_hooks


_CACHE = {}


def get_filament_service(domain: Optional[str] = None) -> FilamentDecisionService:
    """Return a FilamentDecisionService configured for the given domain.

    Configuration is read from Django settings.FILAMENT_THRESHOLDS which may
    map domain -> threshold. Fallback to FILAMENT_DEFAULT_THRESHOLD or
    FilamentDecisionService.DEFAULT_RISK_THRESHOLD.
    """
    key = domain or 'default'
    if key in _CACHE:
        return _CACHE[key]

    cfg = getattr(settings, 'FILAMENT_THRESHOLDS', {}) or {}
    default = getattr(settings, 'FILAMENT_DEFAULT_THRESHOLD', None)
    threshold = cfg.get(key, default)
    service = FilamentDecisionService(hooks=default_filament_hooks(), risk_threshold=threshold)
    _CACHE[key] = service
    return service
