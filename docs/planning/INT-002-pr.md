# PR: INT-002 — Append-only Audit Service (skeleton)

Summary

Provide a minimal append-only Audit Service shim that the product can call to persist S4 audit entries. The repo already contains `core/audit_service.py` (file-based fallback). This PR documents usage and adds integration tests/examples.

Changes

- docs/planning/INT-002-pr.md — PR description
- core/audit_service.py — existing shim (no change in this PR)
- docs/planning/usage_audit.md — example usage and API contract

Testing

Examples:

```python
from core.audit_service import append_audit_entry, search_by_correlation_id
aid = append_audit_entry('u1','alert','alert_1','intervene', {'note':'ok'}, 'c_1')
print(search_by_correlation_id('c_1'))
```

Acceptance Criteria

- Append-only behavior documented
- Example usage in `docs/planning/usage_audit.md`
- Follow-up ticket created to replace file-based fallback with DB-backed model + migrations

Notes

This is a minimal, safe starting point — next work: DB model `AuditEntry`, migrations, API endpoints, retention policy and ACLs.
