# INT-002 — Audit Service (S4 central)

**Título:** Audit — Implementar serviço central append-only para S4 (Audit Log)

**Descrição:**
- **Contexto:** Atualmente, audit logs (S4) são persistidos por módulo, resultando em redundância e dificuldade para consultas cross-module (ex.: trace an action from Dashboard → Alert → Course). Um serviço central facilitará compliance e queries por correlation_id.
- **Comportamento atual:** Logs S4 são escritos por módulos em storage local/por-DB sem um contrato comum.
- **Comportamento esperado:** Uma API `/api/audit/` append-only (POST) para gravação e GET filters (by entity, user, correlation_id, time range). Retenção e export (CSV) disponíveis para compliance.

**Passos de implementação:**
1. Backend: novo service `audit` com model `{actor_id, action, target_type, target_id, metadata, correlation_id, timestamp}`; POST `/api/audit/` (write), GET `/api/audit/?filters` (read).  
2. Frontend: integrar chamadas de audit em commits críticos (Intervention, Course publish, Submission review) — via middleware/SDK.  
3. Infra: index on correlation_id; export job to CSV; retention policy config.  
4. QA: tests for write/read, permissions, and data integrity; E2E trace sample (Dashboard->Alert->Intervention writes appear in audit).

**Dependências:** INT-001 (telemetry schema & correlation_id standard).  

**Critérios de aceitação:**
- API `/api/audit/` aceita S4 writes and returns 201.  
- GET filters return expected entries and support `correlation_id` lookups.  
- Retention/export job runnable by admin.  

**Estimativa (story points):** 8  
**Responsável:** backend-lead  
**Prioridade:** Alta
