import json
import os
import pytest
from jsonschema import validate, ValidationError

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

# minimal JSON Schemas for contract tests
S1A_SCHEMA = {
    "type": "object",
    "required": ["event", "version", "timestamp", "correlation_id"],
    "properties": {
        "event": {"type": "string"},
        "version": {"type": "string"},
        "timestamp": {"type": "string"},
        "correlation_id": {"type": "string"},
        "user_id": {"type": ["string", "null"]},
        "env": {"type": "string"}
    }
}

S2_SCHEMA = S1A_SCHEMA.copy()
S4_SCHEMA = S1A_SCHEMA.copy()

EXAMPLE_EVENTS = [
    ("s1a.dashboard.insight.click.v1", {
        "event": "s1a.dashboard.insight.click.v1",
        "version": "v1",
        "timestamp": "2026-01-14T12:00:00Z",
        "correlation_id": "c_test_1",
        "user_id": "u_1",
        "env": "test"
    }),
    ("s2.alert.state_change.v1", {
        "event": "s2.alert.state_change.v1",
        "version": "v1",
        "timestamp": "2026-01-14T12:05:00Z",
        "correlation_id": "c_test_2",
        "user_id": "u_2",
        "env": "test"
    }),
    ("s4.audit.alert_intervention.v1", {
        "event": "s4.audit.alert_intervention.v1",
        "version": "v1",
        "timestamp": "2026-01-14T12:07:00Z",
        "correlation_id": "c_test_3",
        "user_id": "u_3",
        "env": "test",
        "audit_id": "a_123",
        "entity_id": "alert_1",
        "actor_id": "u_3",
        "action": "intervene",
        "details": {"comment": "test"}
    })
]

@pytest.mark.parametrize("name,event", EXAMPLE_EVENTS)
def test_event_matches_schema(name, event):
    if name.startswith('s1a'):
        schema = S1A_SCHEMA
    elif name.startswith('s2'):
        schema = S2_SCHEMA
    elif name.startswith('s4'):
        schema = S4_SCHEMA
    else:
        pytest.skip("schema not defined")
    try:
        validate(instance=event, schema=schema)
    except ValidationError as e:
        pytest.fail(f"Event {name} failed schema validation: {e}")
