# PR: INT-001 — Telemetry Contract Tests

Summary

Add JSON Schema files and contract tests to validate telemetry events (S1a–S4). Add a simple pytest test that validates example events against schemas. Add CI job (instructions) to run the contract tests on push.

Changes

- `docs/planning/schemas/*.schema.json` — JSON Schemas for S1a/S2/S3/S4
- `tests/test_telemetry_contract.py` — contract tests (examples)
- `docs/planning/INT-001-pr.md` — PR description

Testing

Run:

```bash
pip install -r dev-requirements.txt
pytest tests/test_telemetry_contract.py
```

Acceptance Criteria

- Contract tests pass locally
- CI runs contract tests on push to protect schema compatibility

Notes

- The schemas are intentionally minimal and should be extended per product needs.
