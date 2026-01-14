# INT-004 — Alert Intervention Modal & Routing

**Título:** Alerts — Implementar `/alerts/<id>` route e `InterventionModal` com history e audit

**Descrição:**
- **Contexto:** O fluxo de intervenção não possui modal contextual com histórico e audit trail persistente; falta rota persistente para deep-links e bookmarking.
- **Comportamento atual:** CTA `Intervir` abre um fluxo simples sem histórico; ações não são auditadas em S4.
- **Comportamento esperado:** `/alerts/<alert_id>` deep-linkable; `InterventionModal` com `alert_history`, severity, suggested actions, CTAs (`Registrar Intervenção`, `Delegar`, `Resolver`) e gravação de S4 em cada ação.

**Passos de implementação:**
1. Backend: enrich `/api/v1/cognition/alerts/` with `severity`, `context`, `alert_history`; POST `/api/v1/cognition/alerts/<id>/interventions/` writes S4.
2. Frontend: AlertCard clickable → open `/alerts/<id>` route + `InterventionModal` with history and CTAs; optimistic UI updates and toasts.  
3. UX: role-specific flows (instructor vs admin) and microtests for clarity; SLA progress visualization.  
4. QA: E2E for modal, intervention creation, audit write, and 403 flows for unauthorized actions.

**Dependências:** INT-002 (Audit Service), INT-001 (Telemetry schema).  

**Critérios de aceitação:**
- Route `/alerts/<id>` opens modal with history ≤300ms.  
- `Registrar Intervenção` creates S4 entry and updates card state (S2).  

**Estimativa (story points):** 8  
**Responsável:** product-owner / frontend-lead  
**Prioridade:** Alta
