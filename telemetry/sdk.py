"""Resilient telemetry SDK with sampling rules and correlation_id handling.

Features:
- Generates `correlation_id` when missing (prefix `auto-`).
- Configurable sampling rules from Django `settings.TELEMETRY_SAMPLING`,
  environment variable `TELEMETRY_SAMPLING_JSON` or local `sampling_config.json`.
- Does not raise on missing correlation_id; logs a warning instead.
- Attempts to emit to stdout (placeholder transport) and falls back to file queue.
"""
import json
import logging
import os
import random
import uuid
from pathlib import Path
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Load sampling config (priority: env JSON -> django settings -> file -> defaults)
_CONFIG = None
_CONFIG_PATH = Path(__file__).parent / 'sampling_config.json'

def _load_config():
    global _CONFIG
    # 1) env var
    env_json = os.getenv('TELEMETRY_SAMPLING_JSON')
    if env_json:
        try:
            _CONFIG = json.loads(env_json)
            return
        except Exception:
            logger.exception('Invalid TELEMETRY_SAMPLING_JSON')

    # 2) django settings if available
    try:
        from django.conf import settings
        cfg = getattr(settings, 'TELEMETRY_SAMPLING', None)
        if cfg:
            _CONFIG = cfg
            return
    except Exception:
        # not running inside Django or settings not configured
        pass

    # 3) local file
    try:
        _CONFIG = json.loads(_CONFIG_PATH.read_text())
        return
    except Exception:
        pass

    # 4) defaults
    _CONFIG = {
        "default": {
            "rate": 1.0
        },
        "S2": {"rate": 0.05},
        "llm_call": {"rate": 0.02},
        "upload_progress": {"rate": 0.005}
    }


_load_config()


def _should_sample(event_name: str, payload: Dict[str, Any]) -> bool:
    # Determine sampling rate by matching keys in config
    try:
        # exact match
        if event_name in _CONFIG:
            rate = float(_CONFIG[event_name].get('rate', 1.0))
        else:
            # heuristics: find a config key that is substring of event_name
            rate = None
            for key, cfg in _CONFIG.items():
                if key == 'default':
                    continue
                if key.lower() in event_name.lower():
                    rate = float(cfg.get('rate', 1.0))
                    break
            if rate is None:
                rate = float(_CONFIG.get('default', {}).get('rate', 1.0))
        return random.random() < rate
    except Exception:
        # on error, be permissive and sample
        logger.exception('Error evaluating sampling rule for %s', event_name)
        return True


_TELEMETRY_FALLBACK_PATH = os.getenv('TELEMETRY_FALLBACK_PATH', '/tmp/synapse_telemetry_queue.jsonl')


def _ensure_correlation_id(payload: Dict[str, Any]) -> str:
    cid = payload.get('correlation_id') or payload.get('correlationId') or payload.get('correlation-id')
    if cid:
        return cid
    # generate one and attach
    new_cid = f"auto-{uuid.uuid4().hex}"
    payload['correlation_id'] = new_cid
    return new_cid


def emit(event_name: str, payload: Dict[str, Any]) -> bool:
    """Emit event after validation and sampling.

    Returns True if the event was emitted or queued; False if skipped by sampling.
    """
    if not isinstance(payload, dict):
        logger.warning('Telemetry payload must be a dict, got %s', type(payload))
        return False

    cid = _ensure_correlation_id(payload)
    if not cid:
        logger.warning('Could not generate correlation_id for telemetry event %s', event_name)

    if not _should_sample(event_name, payload):
        logger.debug('Telemetry event %s skipped by sampling', event_name)
        return False

    envelope = {"event": event_name, "payload": payload}
    try:
        # Placeholder transport: stdout; replace with real transport in production
        print(json.dumps(envelope, ensure_ascii=False))
        return True
    except Exception:
        logger.exception('Telemetry transport failed, falling back to file queue')
        try:
            with open(_TELEMETRY_FALLBACK_PATH, 'a', encoding='utf-8') as f:
                f.write(json.dumps(envelope, ensure_ascii=False) + '\n')
            return True
        except Exception:
            logger.exception('Failed to write telemetry fallback file')
            return False
