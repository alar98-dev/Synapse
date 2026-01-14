from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import logging
import os
from typing import Any, Callable, Dict, Iterable, List, Mapping, Optional

import requests
try:
    from django.conf import settings
except Exception:  # pragma: no cover - allow import outside Django
    settings = None

logger = logging.getLogger(__name__)


class EventState(Enum):
    S0 = "S0"
    S1A = "S1a"
    S1B = "S1b"
    S2 = "S2"
    S3 = "S3"
    S4 = "S4"


class FilamentDecision(Enum):
    ACEITAR = "ACEITAR"
    AJUSTAR = "AJUSTAR"
    BLOQUEAR = "BLOQUEAR"


@dataclass
class EventDimensions:
    identidade: Mapping[str, Any] = field(default_factory=dict)
    contexto: Mapping[str, Any] = field(default_factory=dict)
    dependencia: Mapping[str, Any] = field(default_factory=dict)
    risco: Mapping[str, Any] = field(default_factory=dict)


@dataclass
class EventVector:
    name: str
    module: str
    story_id: str
    dimensions: EventDimensions
    payload: Mapping[str, Any] = field(default_factory=dict)
    state_history: List[EventState] = field(default_factory=list)

    def advance_state(self, state: EventState) -> EventState:
        self.state_history.append(state)
        return state


@dataclass
class FilamentAuditEntry:
    vector_name: str
    module: str
    story_id: str
    state: EventState
    decision: FilamentDecision
    reason: str
    timestamp: datetime
    context_snapshot: Mapping[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "vector_name": self.vector_name,
            "module": self.module,
            "story_id": self.story_id,
            "state": self.state.value,
            "decision": self.decision.value,
            "reason": self.reason,
            "timestamp": self.timestamp.isoformat(),
            "context_snapshot": self.context_snapshot,
        }


@dataclass
class FilamentDecisionSummary:
    decision: FilamentDecision
    message: str
    audit_entry: FilamentAuditEntry


FilamentHook = Callable[[FilamentAuditEntry], None]


class FilamentHookManager:
    def __init__(self, hooks: Optional[Iterable[FilamentHook]] = None) -> None:
        self._hooks: List[FilamentHook] = list(hooks or [])

    def notify(self, entry: FilamentAuditEntry) -> None:
        for hook in self._hooks:
            try:
                hook(entry)
            except Exception:  # pragma: no cover - logging hook failure
                logger.exception("Filament hook failed", extra={"entry": entry})

    def register(self, hook: FilamentHook) -> None:
        self._hooks.append(hook)


WEBHOOK_URL = os.getenv("FILAMENT_WEBHOOK_URL")


def _webhook_audit(entry: FilamentAuditEntry) -> None:
    if not WEBHOOK_URL:
        logger.info(
            "Filament webhook ping",
            extra={
                "event": entry.vector_name,
                "state": entry.state.value,
                "decision": entry.decision.value,
                "story_id": entry.story_id,
            },
        )
        return

    try:
        requests.post(WEBHOOK_URL, json=entry.to_dict(), timeout=2)
    except requests.RequestException as exc:
        logger.warning("Filament webhook failed", exc_info=exc)


def default_filament_hooks() -> List[FilamentHook]:
    return [_webhook_audit]


class FilamentDecisionService:
    DEFAULT_RISK_THRESHOLD = 0.75

    def __init__(self, hooks: Optional[Iterable[FilamentHook]] = None, risk_threshold: float = None) -> None:
        self.hooks = FilamentHookManager(hooks)
        self.risk_threshold = risk_threshold or self.DEFAULT_RISK_THRESHOLD

    def process(self, vector: EventVector, state: EventState) -> FilamentDecisionSummary:
        reason, decision = self._evaluate(vector)
        entry = self._record_entry(vector, state, decision, reason)
        return FilamentDecisionSummary(decision=decision, message=reason, audit_entry=entry)

    def log_state(self, vector: EventVector, state: EventState, decision: FilamentDecision, reason: str) -> FilamentAuditEntry:
        return self._record_entry(vector, state, decision, reason)

    def record_learning(
        self,
        vector: EventVector,
        reason: str,
        decision: FilamentDecision = FilamentDecision.AJUSTAR,
        state: EventState = EventState.S4,
    ) -> FilamentAuditEntry:
        return self._record_entry(vector, state, decision, reason)

    def _record_entry(self, vector: EventVector, state: EventState, decision: FilamentDecision, reason: str) -> FilamentAuditEntry:
        entry = FilamentAuditEntry(
            vector_name=vector.name,
            module=vector.module,
            story_id=vector.story_id,
            state=state,
            decision=decision,
            reason=reason,
            timestamp=datetime.utcnow(),
            context_snapshot={
                "dimensions": {
                    "identidade": dict(vector.dimensions.identidade),
                    "contexto": dict(vector.dimensions.contexto),
                    "dependencia": dict(vector.dimensions.dependencia),
                    "risco": dict(vector.dimensions.risco),
                },
                "payload": dict(vector.payload),
            },
        )
        vector.advance_state(state)
        logger.info("Filament evaluated vector", extra={"entry": entry})
        self.hooks.notify(entry)
        return entry

    def _evaluate(self, vector: EventVector) -> tuple[str, FilamentDecision]:
        dims = vector.dimensions
        identity_ok = dims.identidade.get("user_active", True) and dims.identidade.get("is_verified", True)
        context_ok = dims.contexto.get("course_active", True) and dims.contexto.get("cohort_open", True)
        dependency_ok = not dims.dependencia.get("blocked", False)
        # Base checks
        if not identity_ok:
            return "Identidade não confirmada", FilamentDecision.BLOQUEAR
        if not context_ok:
            return "Contexto do curso/cohort inválido", FilamentDecision.BLOQUEAR
        if not dependency_ok:
            return "Dependências bloqueadas", FilamentDecision.BLOQUEAR

        # Enriched risk scoring: combine capacity-based, billing history and resource history
        capacity = dims.risco.get("capacity")
        current = dims.risco.get("current", 0)
        base_score = dims.risco.get("score")
        if base_score is None and capacity:
            base_score = (current + 1) / max(capacity, 1)
        base_score = float(base_score or 0.0)

        billing_score = float(dims.risco.get("billing_history_score", 0.0) or 0.0)
        resource_score = float(dims.risco.get("resource_history_score", 0.0) or 0.0)

        # configurable weights: try settings, fall back to sensible defaults
        bw = 0.5
        rw = 0.3
        bb = 0.2
        try:
            if settings:
                weights = getattr(settings, 'FILAMENT_RISK_WEIGHTS', None)
                if isinstance(weights, dict):
                    bw = float(weights.get('billing', bw))
                    rw = float(weights.get('resource', rw))
                    bb = float(weights.get('base', bb))
        except Exception:
            pass

        combined = (billing_score * bw) + (resource_score * rw) + (base_score * bb)

        # Extra heuristic: large monetary amount increases risk
        try:
            amount = float(dims.risco.get('amount', 0) or 0)
            # normalize amount into a [0,1] heuristic using a configurable cap
            cap = float(getattr(settings, 'FILAMENT_AMOUNT_CAP', os.getenv('FILAMENT_AMOUNT_CAP', 1000)))
            amount_score = min(1.0, amount / max(1.0, cap))
            combined = max(combined, amount_score)
        except Exception:
            pass

        # Final decision
        if combined >= self.risk_threshold:
            return "Limite de risco financeiro/recursos muito alto", FilamentDecision.AJUSTAR

        return "Evento validado pelo filamento", FilamentDecision.ACEITAR
