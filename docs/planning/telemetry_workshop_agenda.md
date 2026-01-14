# Rascunho de Workshop — Telemetria, Sampling e Audit

**Objetivo:** alinhar schema de telemetria S1a–S4, regras de sampling, fluxo de ingestão e contrato de audit (`/core/audit/`) para implementação rápida (INT-001..INT-005).

**Duração sugerida:** 3 horas (com pausa de 10 minutos)

**Participantes (roles)**
- **Facilitador:** Product/Tech lead (pode ser você)  
- **Frontend:** 1 dev (responsável UI/emit events)  
- **Backend/API:** 1–2 devs (audit API, telemetry endpoint)  
- **OPS/Telemetry:** 1 dev/infra (pubsub, Prometheus, OpenSearch)  
- **AI/LLM:** 1 eng (LLMConnector, hashing, circuit-breaker)  
- **UX:** 1 designer (impacto de IDs/UI e breadcrumbs)  
- **QA:** 1 QA (E2E telemetry validation)

Observação: se você estiver sozinho, convide 1 representante externo por função (contractor/consultor) ou aloque stakeholders assíncronos para revisão.

**Prework (2–3 dias antes)**
- Compartilhar `docs/planning/telemetry_audit_report.md` e `docs/planning/issues_import.csv`.  
- Todos leem o esquema atual e listam dúvidas específicas (2–3 pontos cada).  
- BE/OPS preparam breves notas sobre constraints infra (pub/sub, retention, costs).

**Agenda detalhada (timeboxed)**

- **00:00–00:10 — Boas-vindas & objetivos**
  - **Goal:** confirmar escopo, entregáveis e decisões esperadas.

- **00:10–00:40 — Estado atual & problemas-chave (repasse rápido)**
  - **Lead:** você (ou facilitador) apresenta resumo (5–7 min).  
  - **Discussão:** gaps identificados (PII, docker.sock, CTAs desabilitados, falta de pipeline).

- **00:40–01:10 — Proposta de Schema (INT-001)**
  - **Lead:** backend / telemetry owner presents draft schema fields and required fields.  
  - **Outcomes:** agree on mandatory fields (`event_type`, `timestamp`, `correlation_id`, `story_id`, `module`, `actor_id`, `payload_meta`), naming conventions and namespaces.

- **01:10–01:30 — Sampling & retention rules**
  - **Lead:** OPS/Telemetry.  
  - **Decisions:** sampling rates (e.g., 1% raw snapshots), rules for full persist (decision != `ACEITAR`, errors), retention windows, access controls for raw data.

- **01:30–01:40 — Pausa (10m)**

- **01:40–02:10 — Audit API & persistence (INT-002)**
  - **Lead:** Backend.  
  - **Discussion points:** API contract `/core/audit/`, RBAC, index patterns, query needs (filter by `story_id`, `correlation_id`, time ranges).  
  - **Outcome:** Acceptable minimal request/response schema and success code.

- **02:10–02:35 — Telemetry ingest pipeline (INT-003) & Metrics**
  - **Lead:** OPS.  
  - **Discuss:** `POST /telemetry/events` flow → pub/sub → processors; Prometheus metrics to export; alerting thresholds; OpenTelemetry tracing plan.

- **02:35–02:50 — LLM telemetry & security (INT-004, SEC-001)**
  - **Lead:** AI engineer / security.  
  - **Decisions:** events to emit (`turn_success`, `turn_failed`, `invalid_llm_response`, `fallback_used`), hashing policy for prompts, sample raw storage policy, retention and access.

- **02:50–03:00 — Action items, owners, next steps**
  - **Deliverables:** who creates `INT-001` schema PR, who implements `/core/audit/` stub, who configures pipeline, E2E test owners, timeline (Sprint 0 & 1).  
  - **Close:** capture decisions in ADR or short decision log.

**Artefatos de saída (imediatos)**
- `docs/planning/INT-001-telemetry-schema.md` (PR) — owner: backend/telemetry.  
- Minimal `POST /telemetry/events` validator + fixtures — owner: ops/backend.  
- `POST /core/audit/` stub + DB migration — owner: backend.  
- Sampling & retention runbook (OPS) — owner: ops.  
- E2E test plan & smoke tests (QA) — owner: QA.

**Critérios de decisão (na sessão)**
- Schema aceito se 80% dos participantes aprovarem com <3 blockers.  
- Sampling rates aprovados se custo estimado vs retention tradeoffs forem dentro do budget (OPS OK).  
- Audit API design aprovado se queries chave (by `story_id` & `correlation_id`) retornarem em <500ms em staging (estimativa/operação).

**Facilitação e roles no meeting**
- **Timekeeper:** UX or QA — monitora o tempo por bloco.  
- **Scribe:** alguém registra decisões e tasks (usar `docs/planning/telemetry_audit_report.md` and update).  
- **Owner assignments:** cada deliverable recebe `owner` e `estimate` ao final.

**Convites / template de e-mail**
- Assunto: "Workshop — Telemetria, Sampling & Audit (3h)"  
- Body: one-paragraph objectives, prework links to `docs/planning/telemetry_audit_report.md` and `docs/planning/issues_import.csv`, agenda + RSVP.

**Sequência recomendada pós-workshop**
1. Criar PR `INT-001` (schema) + PR `INT-002` (audit API stub) — 3 dias.  
2. Ops provisiona pub/sub + minimal processors in staging — 1 week.  
3. FE implementa S1a emission + FE E2E hooks — sprint 1.  
4. QA validates E2E and signs off; Ops enables Prometheus dashboards — sprint 1/2.

---

Arquivo criado: `docs/planning/telemetry_workshop_agenda.md`
