# Audit Service — Usage & Contract

This document explains the minimal append-only audit shim (`core/audit_service.append_audit_entry`) and recommended integration steps.

Contract

- Endpoint / function: `append_audit_entry(actor_id, entity_type, entity_id, action, details, correlation_id, timestamp=None)`
- Required fields: `actor_id`, `entity_type`, `entity_id`, `action`, `correlation_id`
- Returns: `audit_id` (string)

Behavior

- Tries to persist to Django `AuditEntry` model when available.
- Fallback: append newline-delimited JSON lines to `/tmp/synapse_audit_store.jsonl` (append-only).
- Search helper: `search_by_correlation_id(correlation_id, limit=100)`.

Next steps

1. Implement `AuditEntry` Django model with fields matching the schema in `docs/planning/schemas/s4.schema.json`.
2. Add migrations and admin list view.
3. Expose API endpoints (`GET /api/v1/audit/` and `POST /api/v1/audit/`) with RBAC.
4. Add retention policy and export/archival flow.

Example

```python
from core.audit_service import append_audit_entry
append_audit_entry('u_1', 'alert', 'alert_1', 'intervene', {'note':'test'}, 'c_1')
```

