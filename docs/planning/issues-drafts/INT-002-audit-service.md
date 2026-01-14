# INT-002 — Central Audit Service (append-only)

**Title:** Implement Central Audit Service (append-only) + query by correlation_id

**Summary:** Implement an append-only Audit Service for S4 events, with API endpoints to append and query by `correlation_id`. Provide migration from per-module logs to central store and define retention/export policies.

**Deliverables:**
- API endpoints: `POST /api/v1/audit/` and `GET /api/v1/audit/?correlation_id=` (with pagination)
- DB schema (append-only table) + migrations
- Backfill plan for existing module-level audit entries
- Integration examples for Alerts and Dashboard

**Acceptance Criteria:**
- Audit entries can be appended and retrieved by `correlation_id`
- Entries are immutable (append-only semantics)
- Query performance acceptable for typical searches (<200ms for small result sets)

**Labels:** audit, backend, infra
**Assignee:** alar98-dev
**Priority:** High
**Estimate (SP):** 8

**Notes:** Replace `YOUR_USERNAME` with the real assignee before import.
