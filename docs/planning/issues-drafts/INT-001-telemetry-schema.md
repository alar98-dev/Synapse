# INT-001 — Telemetry Schema Registry and Contract Tests

**Title:** Telemetry Schema Registry + contract tests

**Summary:** Define canonical event naming and JSON Schemas for S1a–S4, implement contract tests (pytest + jsonschema) and integrate tests in CI. Ensure `correlation_id` is required and sample rules defined.

**Deliverables:**
- `docs/planning/INT-001-telemetry-schema.md` (spec)
- `tests/test_telemetry_contract.py` (contract tests)
- `telemetry/sdk.py` (validation + sampling enforcement)
- CI job to run telemetry contract tests

**Acceptance Criteria:**
- JSON Schema defined for S1a/S2/S3/S4 and stored in repo
- Example events validate against schema
- CI fails on schema violations
- Telemetry SDK raises if `correlation_id` missing

**Labels:** telemetry, infra, contract-tests
**Assignee:** alar98-dev
**Priority:** High
**Estimate (SP):** 5

**Notes:** Replace `YOUR_USERNAME` with the real assignee before import.
