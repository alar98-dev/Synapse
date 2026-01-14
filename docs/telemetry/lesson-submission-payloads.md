# Telemetria — Submissões de Aula

Modelos de payload para eventos relacionados ao fluxo de submissão de aula.

## S1a — Submissão (clique em "Submeter Resposta")
Disparado no momento da submissão (antes do job de execução).

```json
{
  "event": "S1a",
  "user_id": "uuid-user-123",
  "lesson_id": "lesson-456",
  "submission_id": "submission-789",
  "ui_location": "lesson_detail_editor",
  "cta_label": "Submeter Resposta",
  "session_id": "sess-abc",
  "timestamp": "2026-01-14T12:34:56Z",
  "meta": {
    "language": "python",
    "attempt": 1
  }
}
```

---

## S2 — Status do job / Resultado
Disparado quando o job de execução muda de estado (queued, running, success, fail).

```json
{
  "event": "S2",
  "submission_id": "submission-789",
  "lesson_id": "lesson-456",
  "user_id": "uuid-user-123",
  "status": "running",
  "progress_pct": 40,
  "timestamp": "2026-01-14T12:35:10Z",
  "meta": { "runner": "sandbox-1" }
}
```

---

## S4 — Audit trail / histórico de submissões
Disparado para registrar ações de usuário/estado com correlação e contexto completo.

```json
{
  "event": "S4",
  "user_id": "uuid-user-123",
  "action": "submission_created",
  "target_type": "submission",
  "target_id": "submission-789",
  "lesson_id": "lesson-456",
  "previous_state": null,
  "new_state": "queued",
  "correlation_id": "corr-xy-123",
  "timestamp": "2026-01-14T12:34:58Z",
  "meta": {
    "client": "web",
    "code_size": 512
  }
}
```

---

Sugestão: publicar esses eventos via `POST /telemetry/events` ou via pub/sub; validar esquema com JSON Schema/Protobuf e coordenar rollout com analytics team.