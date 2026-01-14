# Planejamento Integrado — Visão Executiva

**Objetivo:** consolidar os planejamentos por módulo (Dashboard, Alertas, Cursos, Aulas/Submissão, Materiais, AI Center, Billing) em tabelas padrão, detectar lacunas e redundâncias, priorizar por impacto em KPIs, gerar um backlog priorizado e mapear fluxos integrados com telemetria.

> Nota operacional: Antes de mover tickets para sprint, todos os módulos devem garantir: (1) eventos com `correlation_id` propagado; (2) `Responsável` preenchido com owner (nome/alias); (3) usar o Telemetry Schema Registry (INT-001) e o Audit Service central (INT-002).

---

## 1) Resultados da análise rápida ✅
- Todos os módulos possuem bons requisitos e um conjunto de tickets iniciais; grandes lacunas comuns: falta de padronização de telemetria (naming/schema), falta de um Audit Service (S4 unificado), e inconsistências UX (breadcrumbs, skeletons, toast patterns).
- Dependências críticas identificadas: Dashboard ← Alerts, Courses ← Billing (checkout/enroll), Submissions ↔ AI Center (review/assistant), Materials → Courses/Lessons, AI Center → Billing (token costs).
- Prioridade tática: estabilizar telemetria e auditability (S1a–S4), implementar Alert intervention + Dashboard Insight modal, habilitar Submission streaming, persistência de AI sessions, and Billing endpoints for enroll/checkout.

---

## 2) Consolidated module table (executive-ready) ✅
| Módulo | Elemento Crítico | Lacuna | Sugestão | Dependência | Impacto KPI | Prioridade | Telemetria | Status |
|---|---|---|---|---|---:|---:|---|---|
| Dashboard | Hero CTA, Session Cards, KPI Cards | CTAs dead-end, cards not clickable, missing breadcrumbs | DashboardInsightModal, SessionCard clickable, badges, skeletons | `/cognition/sessions/`, Alerts | ↓TTA, ↑Engagement | Alta | S1a (cta), S2 (card state), S4 (audit) | PL-001 pending |
| Alerts | Alert list, InterventionModal, Severity badges | No modal/history, no persistent route, missing audit | `/alerts/<id>` route, InterventionModal, S4 audit storage, role gating | Courses, Dashboard | ↓TTR, ↑Resolution | Alta | S1a (intervene), S2 (state), S4 (audit) | PL-003 pending |
| Courses | CRUD, Progress badges | Creation blocked, no pagination, no progress badges | CRUD API, pagination, progress %, publish flow | Billing (for paid courses) | ↑Courses published | Alta | S1a (create/edit), S2 (state), S4 (audit) | pending |
| Course Detail | Hero enroll (cohort) | No cohort selection, CTA missing telemetry | Cohort dropdown, require `cohort_id` on enroll | Billing (if paid) | ↑Enroll conversion | Alta | S1a (enroll), S3 (payments), S4 (checkout logs) | pending |
| Submissions | Submission flow, streaming logs | No history, no streaming, poor feedback | SubmissionHistory UI, SSE/WS logs, review CTA | AI Center (for review), Materials (attachments) | ↑Success rate, ↓support tickets | Alta | S1a (submit), S2 (job status), S4 (view history) | PL-004 pending |
| Materials | Upload + association | Upload API incomplete, weak UX/filters | `/api/materials/` CRUD, upload progress, badges, search index | Courses / Lessons | ↑Materials usage, better discovery | Alta | S1a.material_action, S2.material_state, S4.association | pending |
| AI Center | Sessions, Commands, Logs | No persistence, poor WS indicators, no cost estimator | Persist sessions/logs, command_id, WS status, token usage alerts | Billing (costs), Submissions (review) | ↑Trust (MAU), ↓MTTR | Alta | S1a (exec), S2 (WS), S3 (token usage), S4 (logs) | pending |
| Billing | Subscriptions, receipts, plan_limits | Isolated view, no upgrade flow, no plan_limits exposure | `/payments/*`, UI `BillingOverview`, plan_limits, webhooks | Courses (enroll), AI Center (costs) | ↑ARPU, ↓Churn | Média/Alta | S1a (clicks), S3 (payments), S4 (receipt download) | pending |

---

## 3) Cross-module dependencies (critical path) 🔗
- Dashboard -> Alerts: Dashboard CTAs must deep-link to Alert pages and fetch context (course_id, lesson_id).
- Alerts -> Courses: Interventions often require context within Course/Lesson (assignment, remediation links).
- Course Detail -> Billing: Enrollment (paid) must call Billing checkout and surface plan_limits/status.
- Submissions -> AI Center: "Ask AI" or "Request review" triggers AI command executions; AI Center must persist logs/command IDs so Submission history links to command logs.
- AI Center -> Billing: Executions that consume tokens need pre-exec cost estimates and post-exec usage events to charge correctly.
- Materials -> Submissions/Courses: Materials upload associable to lessons and visible in Submission UX and Course Cards.

---

## 4) Telemetry & Redundancies — Findings & Recommendations 📡
Findings
- Every doc uses S1a/S2/S3/S4 but with module-specific semantics and inconsistent event naming (e.g., `S1a.material_action` vs generic `S1a`).
- Some high-cardinality events (upload progress, log streaming) are suggested without sampling rules.
- Audit logs (S4) are implemented per-module; risk of duplication and inconsistent schema.

Recommendations
- Define a canonical event registry and schema (s1a|s2|s3|s4) with namespaced events: `s1a.{entity}.{action}.v1` (ex: `s1a.material.upload.v1`).
- Standardize required fields: `user_id`, `timestamp`, `correlation_id`, `session_id?`, `course_id?`, `lesson_id?`, `entity_id`.
- Add `correlation_id` propagation across flows (Alert→Modal→Action→Audit→Course change) to trace end-to-end.
- Define sampling rules for high-cardinality events (upload progress) and enforce via telemetry-lib in frontend/backend.
- Implement central Audit Service (S4) with append-only entries and query API to be used by Alerts, Courses, Submissions.
- Create telemetry contract tests (INT-013) to prevent schema drift.

---

## 5) Prioritization rationale (executive) 🎯
- Highest priority: Telemetry schema & central audit (intel for all features), Alerts + Dashboard integration (reduce TTR/TTA), Submission streaming and AI Center persistence (critical for UX & reliability).
- Medium priority: Billing UI endpoints (priority increases if monetization is primary), global breadcrumb & ToastService for UX consistency.
- Low/ongoing: Search index improvements, resumable uploads, advanced UX polish.

---

## 6) Integrated flow map (textual / sprint-ready) 🗺️
Flow: Alert triggers → Dashboard → Intervention
1. Alert created in `/api/v1/cognition/alerts` (S2: alert_created)
2. Dashboard pulls `insights` (GET `/core/dashboard/insights/`) and shows `SessionCard` (S2: card_state)
3. User clicks CTA on Dashboard (S1a: `s1a.dashboard.insight.click.v1` with `correlation_id`) → opens `DashboardInsightModal`
4. From modal, user navigates to `/alerts/<alert_id>` or opens `InterventionModal` (S1a: `s1a.alert.intervene.v1`)
5. `Registrar Intervenção` POSTs to `/api/v1/cognition/alerts/<alert_id>/interventions/`, writes S4 append-only entry `{alert_id, user_id, action, details, correlation_id}`
6. If intervention updates course/lesson state, backend emits event linking `course_id` and `lesson_id` (S2) and frontend updates Course UI.

Flow: Submission → AI Center review → Billing
1. Student submits `POST /submissions/` (S1a: `s1a.submission.create.v1`) → `submission_id`
2. Backend enqueues job and opens streaming logs `/submissions/<id>/logs/stream` (S2: job status updates)
3. User clicks `Pedir revisão` → may create AI Center command `POST /ai/sessions/<sid>/commands/` (S1a: `s1a.ai.exec.v1` with `command_id`, `estimated_cost`) and emits `S3` if token usage applies
4. AI Center persists logs (S4) and returns result; submission history links to `command_id` (use `correlation_id` to join)
5. For paid executions, Billing is invoked or quota checked (S3) and possibly a charge or plan-limit alert is emitted.

Cross-boundary instrumentation: ensure `correlation_id` is passed along every external call and stored in Audit entries for traceability.

---

## 7) Deliverables created (this pass) ✅
- `docs/planning/integrated_backlog.csv` — prioritized tickets (INT-001…INT-020)
- `docs/planning/integrated_summary.md` — this document (tables, flows, recommendations)

---

## 8) Next steps (proposed immediate plan) ✅
1. Assign owners for INT-001 (telemetry schema) and INT-002 (audit service) — **these unblock many others**. (High priority)
2. Implement telemetry contract tests (INT-013) alongside telemetry schema (INT-001).  (2–3 days)
3. Start Alert & Dashboard integration (INT-003/INT-004) as concurrent sprint items. (2 sprints)
4. Parallel sprint: implement Submissions streaming + AI Center persistence (INT-005/INT-006). (2–3 sprints)
5. Billing endpoints (INT-007) should be prioritized if conversion impact is urgent.

---

## 9) Suggested acceptance criteria snippets (copyable to tickets)
- Telemetry schema ticket (INT-001): "Define JSON schema for S1a/S2/S3/S4; implement contract tests and example events; enforce correlation_id propagation." (accept when contract tests pass)
- Audit service (INT-002): "Implement append-only audit API `/api/audit/` with POST and GET filters (by entity, by user, by correlation_id); ensure retention policy and export CSV." (accept when writable by Alerts and Courses and searchable)
- Dashboard Insight Modal (INT-003): "Modal opens in ≤250ms cached; emits S1a on CTA; deep-links to alerts/courses and records audit S4 on 'Register action'" (E2E ✓)

---

## 10) Risks & mitigations ⚠️
- Risk: High cardinality telemetry without sampling -> cost & storage issues. Mitigate: define sampling rules and enforce via SDK (INT-012).
- Risk: Audit duplication across services -> confusion. Mitigate: central Audit Service (INT-002) with clear schema.
- Risk: Billing not ready -> checkout fallbacks and blocked enroll flow. Mitigate: gating (graceful UX) and explicit messages; prioritize INT-007 if revenue-critical.

---

## 11) Ask / decisions needed (for PO/CTO) 📝
- Confirm if Billing/Payments should be prioritized to 'High' globally (affects scheduling).
- Confirm owners for INT-001 and INT-002 and who will own telemetry contract tests.

---

If you'd like, I can:
- create Issue drafts from `integrated_backlog.csv` in the repo (choose tracker), or
- open PRs adding these files to a project board, or
- generate a CSV ready for import to Jira/GitHub and include issue body templates.

---

**Wrap-up:** I consolidated gaps, dependencies, telemetry issues, priorities, and generated a prioritized ticket CSV and an executive-ready summary. Next I can open issue drafts or generate ticket templates if you want me to proceed. ✅
