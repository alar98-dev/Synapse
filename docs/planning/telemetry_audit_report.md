# Relatório Consolidado — Telemetria, Auditoria e Planejamento

Data: 2026-01-14
Autor: análise automatizada (resumo técnico)

Resumo: inventário e diagnóstico dos módulos principais, lacunas, recomendações priorizadas (INT-xxx), backlog pronto para importação e fluxo integrado (Mermaid). Foco: telemetria S1a–S4, audit trail, UX crítico e hardening do sandbox/LLM.

**Observação:** este arquivo consolida entradas de `docs/planning/01-dashboard.md`, `docs/telemetry/lesson-submission-payloads.md`, `docs/flow/dimensional-enrollment-observer.md`, `docs/llm_integration.md`, `docs/plan.md`, `docs/cae-api.md`, `docs/missing_implementation.md`, `docs/instructor_admin_page_map.md` e `docs/api_detailed.md`.

---

**Tabela consolidada por módulo**

| Módulo / Componente | Elementos críticos | Lacunas / Problemas | Sugestão de melhoria | Responsabilidade | Impacto / KPI | Prioridade | Telemetria (evento, sampling, audit) | Dependências |
|---|---|---|---|---:|---|---|---|---|
| Dashboard | AI Insight Hero (CTA), KPI cards, Sessões Recentes, Atividade | CTAs inativos, falta breadcrumbs, badges, skeletons, logs não vinculados | `DashboardInsightModal`; SessionCard clicável; botão "Registrar ação" -> `/core/audit/` | FE/BE/UX/QA | TTA, CTR, taxa de resolução | Alta | S1a: `s1a.dashboard.insight.click.v1`; S2: card state; S4: audit log (persistir). Sampling: sample 100% for S1a small payloads; S4 persisted full | `/core/dashboard/insights/`, `/cognition/sessions/`, `/core/audit/` |
| Courses / Meus Cursos | Course detail, coorte, matrícula | Falta escolha de coorte no CTA; criação/edição desabilitadas | Adicionar seleção de coorte, enriquecer API `/courses/<id>/enroll/` com `story_id` | BE/FE/UX | Conversion rate, matrícula | Alta | Emitir S1a no clique matricular; S4 no registro de matrícula com `correlation_id`; sample S3 kpi updates | Payments/Stripe, auth, cohort model |
| Aula / Submissions & Sandbox | Editor, Submit, Execution jobs, feedback | Histórico de submissões ausente, sandbox com docker.sock, falta limits, suporta só Python | Persistir histórico (S4), remover docker.sock, aplicar resource limits, usar executor isolado (k8s jobs) | BE/OPS/FE/QA | Success rate submissões, TTR de execução | Alta | S1a: submit click; S2: job status updates (queued/running/success/fail); S4: audit submission events. Sampling: job status S2 high-frequency -> sample (ex: 1:10) for running updates; S4 persisted fully | `sandbox` worker, Celery, storage (S3) |
| Cognition / CAE (AssessmentSession) | Sessions, turns, report, convergence | Telemetria inconsist. de LLM; need to hash PII; missing OpenTelemetry traces | Standardizar payloads, persist `inference` hashes, add traces with OpenTelemetry | BE/AI/QA | Avg turns to converge, session_converged rate | Alta | S1a: session_create; S2: turn events; S3: KPI updates; S4: audit session events persisted. Include `correlation_id`, `story_id` | `LLMConnector`, `telemetry service` |
| LLM Integration / LLMConnector | turn_success/fail, latencies, circuit breaker | Telemetria incompleta e falta sampling, PII risk, fallback not fully instrumented | Emitir events: `turn_success`, `turn_failed`, `invalid_llm_response`, `fallback_used`, record latency, retry counts; mask PII; configure sampling & alerts | BE/AI/OPS | Latency, error rate, fallback rate | High | Events above; high-cardinality fields (prompt content) must be hashed; sample raw payloads (1%) and store hashes + metadata; S4 audit for critical failures | Secrets manager, provider APIs, CAE |
| Filament / Dimensional (Enrollment) | FilamentDecisionService, FilamentAuditEntry, n8n hooks | High-cardinality snapshots in webhooks; requirement to persist S1a→S4 but inconsistent sampling; potential PII exposure | Normalize `FilamentAuditEntry` schema (namespace), keep context snapshot minimal, ensure `story_id` + `correlation_id`; n8n webhook only receives hashed/sampled payloads for analytics, full audit persisted in `core/audit` | BE/OPS | Enrollment acceptance rate, false positives | Alta | S2,S3,S4 persisted; S1a lightweight. Define sampling for snapshots (e.g., store full snapshot when decision != ACEITAR or periodic 1:100) | `n8n`, `core.audit`, `courses` |
| Audit & Telemetry Service | `/core/audit/`, `POST /telemetry/events` | No single schema enforced; events scattered across modules; missing OpenTelemetry + Prometheus metrics | Create unified telemetry schema (INT-001), central `POST /telemetry/events` (or pub/sub), JSON Schema + protobuf, OpenTelemetry tracing + Prometheus metrics | BE/OPS | Compliance, traceability, MTTR | Alta | S4 audit persisted full; S1a lightweight; define sampling and namespace conventions | DB audit table, telemetry pipeline (pub/sub/ES/Opensearch) |
| AI Center (WebSocket) | Console streaming, model selection, agents | WebSocket recovery, no persistent logs, lack of token usage metrics | Persist session logs, reconnect behavior, per-session telemetry, limit token usage view | FE/OPS/AI | Time to reconnect, token usage | Média | WS events S1a/S2; persist critical S4 logs; sample streaming logs | WebSocket backend, LLM providers |
| Payments | Checkout, subscription | Not implemented; route disconnected from UI | Implement minimal Stripe integration for checkout + webhooks; link to Course enrollment flow | BE/OPS/FE | ARPU, conversion | Alta (for monetization) | Emit payment events S4 on success/fail; small sampling for debug | Stripe, billing DB |

---

**Diagnóstico transversal (principais problemas)**

- Telemetria não padronizada: eventos similares (S1a–S4) existem mas sem um schema unificado; campos essenciais (`correlation_id`, `story_id`, `user_id`, `session_id`) às vezes ausentes ou inconsistentes.
- Falta de pipeline central de ingestão: recomenda-se `POST /telemetry/events` ou pub/sub (docs já sugerem). Hoje eventos são enviados diretamente a vários alvos (n8n, logs locais).
- Audit trail não centralizado: `FilamentAuditEntry`/n8n recebem payloads, mas persistência canônica no `core/audit` não é consistente entre fluxos.
- Alta cardinalidade e PII: snapshots/contexts ricos (full payloads) são enviados ao n8n; é preciso hashing e sampling (evitar armazenar PII em texto claro).
- Sandbox inseguro: `docker.sock` usage, falta limits, risco de orphan containers — impacta segurança e custo.
- LLM telemetry inconsistências: falta eventos padronizados (turn_failed, fallback_used), falta sampling de prompts/raw, falta de traces para latência e circuit breaker metrics.
- UX: CTAs críticos desabilitados (Dashboard Hero, Ver logs, Intervir Agora) causando dead-ends e perda de conversão/engajamento.
- Observabilidade incompleta: falta OpenTelemetry traces, Prometheus metrics e Grafana dashboards; docs apontam intenção, mas implementação pendente.

---

**Recomendações concretas (priorizadas, curto prazo = impacto rápido)**

- INT-001 — Padronizar Telemetria & Audit Schema (Alta)
  - Definir JSON Schema/protobuf para eventos S1a–S4; obrigatórios: `event_type`, `timestamp`, `correlation_id`, `story_id` (quando aplicável), `user_id` (pseudonimizado), `module`, `payload_meta`. Publicar em `docs/planning/INT-001-telemetry-schema.md` e criar validação no API.
- INT-002 — API de Audit Central (`/core/audit/`) (Alta)
  - Implementar endpoint que persiste AuditEntries canônicos; frontend deve POST para essa API ao gravar decisões críticas. Garantir schema e RBAC.
- INT-003 — Telemetry Ingest Pipeline + Sampling (Alta)
  - Roteamento via `POST /telemetry/events` → queue/publish → processors: (1) metrics (Prometheus), (2) logs/audit (Opensearch), (3) analytics (data lake). Definir sampling rules: high-cardinality fields sampled (1%), full-body persisted only on decision != ACEITAR or error.
- INT-004 — LLM Telemetry and Circuit-breaker Observability (Alta)
  - Emitir events: `turn_success`, `turn_failed`, `invalid_llm_response`, `provider_circuit_open`, `fallback_used`. Capturar latency, retries, provider id; hash prompts; alert when error rate > threshold.
- INT-005 — Sandbox Hardening (Alta)
  - Remover dependency docker.sock; mover executor para isolated runner (k8s Job or remote executor), enforce CPU/memory limits, sandbox cleanup job.
- FE-001 — Ativar Dashboard Insight Modal & Audit Action (Média/Alta)
  - Implementar modal, CTAs ativos e botão "Registrar ação" que POSTa para `/core/audit/`. Emitir S1a on click and S4 on save.
- QA-001 — E2E Telemetry Validation (Média)
  - Testes E2E que validam emissão S1a, S2, S4, e persistência em `/core/audit/`.

Sequência recomendada: INT-001 → INT-002 → INT-003 + INT-005 in parallel → INT-004 → FE-001 → QA-001.

---

**Backlog priorizado (pronto para Jira/GitHub import) — amostra**

Formato CSV (colunas: key,title,description,labels,priority,estimate,assignee,dependency)

1) INT-001,Padronizar Telemetria & Audit Schema,"Definir e publicar JSON Schema/protobuf para eventos S1a–S4; adicionar validação no endpoint /telemetry/events; incluir campos obrigatórios: correlation_id, story_id, module, event_type; documentar sampling rules.",telemetry,Alta,5,team-lead,

2) INT-002,API de Audit Central `/core/audit/`,`Criar endpoint persistente para AuditEntries com schema canônico {actor_id, action, target_type, target_id, metadata, timestamp, correlation_id, story_id}; migrar FE para usá-lo.`,backend,Alta,8,backend-lead,INT-001

3) INT-003,Pipeline de Telemetria & Sampling,"Implementar ingest pipeline: POST /telemetry/events -> pub/sub -> processors (metrics, logs, analytics); implantar sampling (1% raw snapshots, full persist on errors/adjust/block).",ops/telemetry,Alta,13,ops-lead,INT-001

4) INT-005,Sandbox Hardening e Executor Isolado,"Remover docker.sock dependency; criar executor serviço isolado (k8s job/remote runner); aplicar limits CPU/RAM; cleanup job; revisar segurança." ,infra,Alta,8,infra-lead,

5) INT-004,LLM Telemetry + Circuit Breaker Metrics,"Adicionar eventos LLM: turn_success, turn_failed, invalid_llm_response, fallback_used, provider_circuit_open; capturar latência e retry counts; hash prompts and sample raw payloads.",ai,Alta,8,ai-engineer,INT-003

6) FE-001,Ativar DashboardInsightModal + Audit Action,"Implementar modal, CTAs, SessionCard clicável; botão 'Registrar ação' que posta para `/core/audit/` e emite S1a/S4 events; E2E." ,frontend,Alta,5,frontend-lead,INT-002

7) QA-001,E2E Telemetry & Audit Tests,"Criar testes E2E que validam emissão e persistência de S1a/S2/S4; rodar em pipeline staging; incluir test hooks para n8n webhook observer." ,qa,Media,3,qa-lead,FE-001

8) OPS-001,Observability: Prometheus + Grafana + OpenTelemetry,"Configurar métricas básicas (job duration, success rate), OpenTelemetry tracing, dashboards Grafana e alertas básicos." ,ops,Media,8,ops-lead,INT-003

(Exportar CSV completo se desejar; eu gero arquivo para importação.)

---

**Fluxo integrado (texto + Mermaid)**

Resumo textual: Frontend emite S1a (cliques/CTAs) → Telemetry Ingest (`POST /telemetry/events`) registra evento leve → Telemetry pipeline roteia: metrics (Prometheus), audit (core/audit persist), analytics (raw or sampled) → Backend services (Cognition/CAE, Submissions, Filament) emitem S2/S3 e S4 (audit) com `story_id`/`correlation_id` → n8n observer recebe webhooks filtrados/sampled e insere em dashboards/alerts; full audit guardado em `core/audit`.

Mermaid (simplificado):

```mermaid
flowchart LR
  FE[Frontend UI]
  TelemetryPOST[POST /telemetry/events]
  TelemetryQueue((Pub/Sub))
  Metrics[Prometheus & Grafana]
  AuditDB[(core.audit DB)]
  Analytics[Analytics / Data Lake]
  CAE[Cognition / CAE]
  Sandbox[Sandbox Executor]
  LLM[LLM Provider via LLMConnector]
  Filament[FilamentDecisionService]
  n8n[n8n Webhook Observer]
  DB[(Primary DB)]

  FE -->|S1a click {session_id, story_id, correlation_id}| TelemetryPOST
  CAE -->|S2/S3 events| TelemetryPOST
  Sandbox -->|job status S2| TelemetryPOST
  LLM -->|turn_success/failed| TelemetryPOST
  Filament -->|FilamentAuditEntry S2/S3/S4| TelemetryPOST

  TelemetryPOST --> TelemetryQueue
  TelemetryQueue --> Metrics
  TelemetryQueue --> AuditDB
  TelemetryQueue --> Analytics

  Filament -->|webhook (sampled)| n8n
  n8n -->|alerts/dashboards| Analytics
  CAE --> DB
  Sandbox --> DB
  AuditDB --> DB
```

---

**Telemetria e Audit — padrão recomendado (namespace & campos obrigatórios)**

Namespace padrões:
- `module`: short module id (ex: `dashboard`, `cognition`, `submissions`, `llm`, `filament`)
- `event_type`: `s1a`, `s1b`, `s2`, `s3`, `s4`, or business-specific e.g. `turn_success`

Campos obrigatórios (mínimo):
- `event_type` (string)
- `timestamp` (ISO 8601 UTC)
- `correlation_id` (uuid)
- `story_id` (nullable) — backlog/story ticket if present
- `module` (string)
- `actor_id` (pseudonimizado user_id) or `anonymous`
- `target_type` / `target_id` (when applicable)
- `payload_meta` (JSON object with small keys: size, language, status)
- `sampling_rate` (optional, number) — annotate when sampled

Storage rules & sampling:
- S4 (audit) entries must be persisted 100% (for actions/decisions) into `core.audit`.
- High-cardinality snapshots (user content, full context) must be hashed or sampled (store hash + minimal metadata). Full snapshots saved only when decision != `ACEITAR` or when flagged (error/fraud) OR on 1:100 sample for analytics.
- LLM prompts/raw responses: store hashes, not raw content; sample raw 1% for debugging; always persist `inference` numeric metrics.

---

**Critérios de aceitação (sprint-ready) — por recomendação chave**

- INT-001 (Telemetria Schema):
  - Schema em `docs/planning/INT-001-telemetry-schema.md` aprovado; validator disponível no endpoint `POST /telemetry/events` rejecting payloads without `correlation_id`.
  - Teste unit: 100% payloads de fixtures validados; CI falha se payloads inválidos.

- INT-002 (API Audit):
  - Endpoint `POST /core/audit/` grava entradas com schema canônico; stored rows exibem `actor_id`, `action`, `target_id`, `correlation_id`, `story_id`.
  - Frontend modal write flow grava audit entry e retorna 201; E2E valida persistência.

- INT-003 (Pipeline & Sampling):
  - `POST /telemetry/events` admite eventos; pipeline entrega métricas a Prometheus e linhas a AuditDB.
  - Sampling rules implementadas: raw snapshots sampled 1% and full persist when decision != ACEITAR.

- INT-005 (Sandbox Hardening):
  - Worker não usa `/var/run/docker.sock` em staging; executor isolado responde e passa testes de stress; containers cleanup automático em 5m after job fail.

- FE-001 (Dashboard Modal):
  - Modal abre ≤250ms (cached); clique em CTA emite S1a com correlation_id; registrar ação gera S4 persistido; E2E valida fluxo.

Cada critério deve ter testes automatizados (unit/E2E) e runbook de verificação manual curto.

---

**Próximos passos sugeridos**

- Workshop de 3 horas com representantes FE/BE/OPS/AI/UX/QA para alinhar INT-001..INT-005 e aprovar schema e sampling rules (agenda técnica + decisões).
- Criar issues INT-001..INT-005 no tracker (CSV pronto). Deseja que eu gere o CSV e/ou abra issues PR no repo?
- Sprint 0 (1 semana): implementar `POST /telemetry/events` validator + `core/audit` minimal endpoints + tests; paralelizar Sandbox hardening.
- Sprint 1 (2 semanas): pipeline ingest mínimo + FE modal + E2E telemetry tests; instrumentar LLMConnector events.

---

Arquivos de saída criados por esta análise:
- [docs/planning/telemetry_audit_report.md](docs/planning/telemetry_audit_report.md)

Deseja que eu: (responda uma opção)
- Gere o CSV de issues pronto para import (sim/não)
- Abra issues no GitHub com os templates (sim/não)
- Agende um rascunho de workshop com pauta e lista de participantes (sim/não)

Fim do relatório.
