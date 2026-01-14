# INT-006 — AI Center: Sessions, Commands & Logs

**Título:** AI Center — Persistir sessions, commands, logs; command_id and queue/replay

**Descrição:**
- **Contexto:** AI Center lacks persistence for sessions and command history; reconnection and command replay are fragile; no consistent IDs to link with Submission history and audit.
- **Comportamento atual:** Logs not persisted; commands may be lost on disconnect; no command_id for tracing; no token usage estimates emitted pre/post execution.
- **Comportamento esperado:** CRUD sessions (`/ai/sessions/`), commands API `/ai/sessions/<id>/commands/` that returns `command_id`, persist logs in DB/S3, emit S1a/S2/S3/S4 events, provide WS status UI and queue/replay semantics.

**Passos de implementação:**
1. Backend: sessions and commands models, logs storage (S3 + DB metadata), APIs for create/get, emit telemetry S1a/S2/S3/S4.  
2. Frontend: WS status indicator, queue pending commands during disconnect and replay on reconnect, Save session/permalink UI.  
3. UX: token usage pre-exec estimates and warnings, session sharing with permissions.  
4. QA: reconnection/replay tests, token usage monitoring, permissions for permalinks.

**Dependências:** INT-001 (telemetry), INT-002 (audit usage if actions should be recorded).  

**Critérios de aceitação:**
- Commands return `command_id` and are persisted with logs accessible via API.  
- WS reconnect and queued commands replay successfully.  
- Token usage events emitted (S3) and pre-exec estimate shown in UI.

**Estimativa (story points):** 10  
**Responsável:** ai-lead  
**Prioridade:** Alta
