# INT-001 — Telemetry Schema Registry

Purpose: define canonical event naming and JSON Schemas for S1a–S4 events, provide examples and contract tests.

Naming convention (required):
- S1a: `s1a.{entity}.{action}.v1` e.g. `s1a.dashboard.insight.click.v1`
- S2: `s2.{entity}.{state}.v1` e.g. `s2.alert.state_change.v1`
- S3: `s3.{domain}.{event}.v1` e.g. `s3.billing.payment.v1`
- S4: `s4.audit.{entity}.v1` e.g. `s4.audit.alert_intervention.v1`

Required common fields (all events):
- `event` (string)
- `version` (string)
- `timestamp` (ISO8601)
- `correlation_id` (string) — REQUIRED
- `user_id` (string|null)
- `env` (string) — e.g. `staging|prod`

S1a schema (summary):
- `entity_id` (string|null)
- `action` (string)
- `target` (object|null)
- `metadata` (object|null)

S2 schema (summary):
- `entity_id` (string)
- `prev_state` (string|null)
- `new_state` (string)
- `reason` (string|null)

S3 schema (summary):
- domain-specific payload (payment tokens, ws_state, etc.)

S4 schema (summary):
- `audit_id` (string)
- `entity_id` (string)
- `actor_id` (string)
- `action` (string)
- `details` (object)
- `correlation_id` (string)

Files created:
- `docs/planning/INT-001-telemetry-schema.md` (this file)
- `tests/test_telemetry_contract.py` (contract tests stub)

Next: add contract tests (JSON Schema validation) and enforce via CI.
