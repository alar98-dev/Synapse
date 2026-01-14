# INT-005 — Submission History + Streaming

**Título:** Submissions — Implementar histórico de submissões e streaming de logs (SSE/WS)

**Descrição:**
- **Contexto:** Feedback de submissões é lento e pouco informativo; faltam histórico persistente e logs em tempo real para o job de execução.
- **Comportamento atual:** Sem histórico de envios; logs não visíveis em tempo real; não há reconnection/retry de streaming.
- **Comportamento esperado:** `GET /submissions/?lesson_id=` listagem; `POST /submissions/` retorna `submission_id`; streaming endpoint `/submissions/<id>/logs/stream` via SSE ou WebSocket; `SubmissionHistory` UI com status, timestamps, and links to logs and artifacts.

**Passos de implementação:**
1. Backend: `POST /submissions/` (create), `GET /submissions/?lesson_id=` (list), streaming logs via SSE/WS, storage of artifacts and logs (DB + S3).  
2. Frontend: `SubmissionHistory` component with live logs (`SubmissionRun`), reconnection policy and heartbeats, CTA `Pedir revisão` linking to AI Center or ticket system.  
3. UX: messages for ETA, progress and suggested next steps; helpful error states and retry guidance.  
4. QA: tests for reconnect, rate-limiting, payload validation, and E2E success workflow.

**Dependências:** AI Center for review flows; INT-001 for telemetry; INT-002 for any audit writes.  

**Critérios de aceitação:**
- Streaming logs reconnects on disconnect and shows logs in real time.  
- `s1a.submission.create.v1` emitted on submission with `{submission_id, lesson_id, user_id, correlation_id}`.  
- History persists and is retrievable via the API.

**Estimativa (story points):** 13  
**Responsável:** backend-lead  
**Prioridade:** Alta
