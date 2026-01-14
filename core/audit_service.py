"""Simple audit service skeleton (append-only) used by INT-002.

Provides a minimal in-repo implementation: an append-only model and a small API helper.
This is a shim to be replaced by a full API endpoint and persistence (DB) in production.
"""
import uuid
import json
from datetime import datetime
from threading import Lock

_AUDIT_STORE_PATH = '/tmp/synapse_audit_store.jsonl'
_lock = Lock()

def append_audit_entry(actor_id, entity_type, entity_id, action, details, correlation_id, timestamp=None):
    """Append audit entry to a newline-delimited JSON file (append-only).

    Returns the audit_id.
    """
    if timestamp is None:
        timestamp = datetime.utcnow().isoformat() + 'Z'
    audit_id = str(uuid.uuid4())
    entry_data = {
        'audit_id': audit_id,
        'actor_id': actor_id,
        'entity_type': entity_type,
        'entity_id': entity_id,
        'action': action,
        'details': details or {},
        'correlation_id': correlation_id,
        'timestamp': timestamp
    }

    # Try to persist to DB via AuditEntry model when running inside Django.
    try:
        from django.utils.dateparse import parse_datetime
        from .models import AuditEntry
        ts = timestamp
        if isinstance(ts, str):
            ts = parse_datetime(ts)
        if ts is None:
            from datetime import datetime
            ts = datetime.utcnow()

        AuditEntry.objects.create(
            audit_id=audit_id,
            actor_id=actor_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            details=details or {},
            correlation_id=correlation_id,
            timestamp=ts,
        )
        return audit_id
    except Exception:
        # Fallback to append-only file if DB not available or any error occurs.
        line = json.dumps(entry_data, ensure_ascii=False)
        with _lock:
            with open(_AUDIT_STORE_PATH, 'a', encoding='utf-8') as f:
                f.write(line + '\n')
        return audit_id

def search_by_correlation_id(correlation_id, limit=100):
    """Search audit entries by correlation_id.

    Prefer DB-backed search, fallback to scanning the file if DB not available.
    """
    try:
        from .models import AuditEntry
        qs = AuditEntry.objects.filter(correlation_id=correlation_id).order_by('-timestamp')[:limit]
        return [
            {
                'audit_id': str(a.audit_id),
                'actor_id': a.actor_id,
                'entity_type': a.entity_type,
                'entity_id': a.entity_id,
                'action': a.action,
                'details': a.details,
                'correlation_id': a.correlation_id,
                'timestamp': a.timestamp.isoformat(),
            }
            for a in qs
        ]
    except Exception:
        # Fallback to file scan
        results = []
        try:
            with open(_AUDIT_STORE_PATH, 'r', encoding='utf-8') as f:
                for line in f:
                    try:
                        obj = json.loads(line)
                    except Exception:
                        continue
                    if obj.get('correlation_id') == correlation_id:
                        results.append(obj)
                        if len(results) >= limit:
                            break
        except FileNotFoundError:
            return []
        return results

if __name__ == '__main__':
    # quick manual test
    aid = append_audit_entry('u0', 'alert', 'alert_1', 'intervene', {'note':'manual test'}, 'c_test_manual')
    print('appended', aid)
    print(search_by_correlation_id('c_test_manual'))
