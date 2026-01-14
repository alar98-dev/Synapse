# Planejamento — Alertas (Human Intervention)

## Resumo do Módulo (padrão)

> Nota: Todos os eventos emitidos por este módulo devem incluir `correlation_id`. Preencher o campo `Responsabilidade` com nome/alias do owner antes de mover para sprint.


| Campo | Descrição |
| --- | --- |
| Módulo | Alertas (Human Intervention) |
| Elementos críticos | Lista de cards de alerta (clickable); CTAs: Intervir Agora, Resolver, Delegar, Escalar; Severity badges; SLA timers; InterventionModal; Audit history |
| Lacuna | Alert cards não clicáveis; CTA Intervir sem modal/histórico; Severidade não persistida; Falta de rota persistente `/alerts/<alert_id>`; Falta audit logs pesquisáveis |
| Sugestão | Enriquecer payload de alertas com `severity` e `context`; Implementar `/alerts/<alert_id>` route + `InterventionModal` com history; Append-only audit (S4); role gating e SLA progress bar (FE/BE/UX/QA) |
| Responsabilidade | Frontend / Backend / UX / QA / Security |
| Impacto | Redução do tempo para intervenção (TTR); aumento da taxa de resolução dentro do SLA; melhoria de compliance e rastreabilidade |
| KPI | TTR (time to respond); SLA compliance; taxa de resolução |
| Prioridade | Alta |
| Telemetria | S1a: `s1a.alert.intervene.v1` {alert_id, user_id, action, correlation_id}; S2: alert state change {alert_id, prev_state, new_state}; S4: audit entries persisted and queryable |

**Resumo:** Habilitar um fluxo completo e rastreável de intervenção humana: modal contextual, severidade, histórico (audit log), breadcrumbs/roteamento permanente e telemetria consistente (S1a/S2/S4). Este documento detalha lacunas, sugestões, plano de implementação, critérios de validação, KPIs e tickets sugeridos.

---

## ✅ Elementos críticos do fluxo
- **Lista de cards de alerta** (clickable list view)
- **Botões de ação:** `Intervir Agora`, `Resolver`, `Delegar`, `Escalar`
- **Indicadores:** badge de **severity** (Alta/Média/Baixa), **SLA** e tempo desde a criação
- **Contexto / Breadcrumbs:** link para `curso`, `aula`, `usuário`, `item` e `/alerts/<alert_id>` (URL persistente)
- **Modal/Contextualização:** `InterventionModal` com histórico, severidade, conteúdo do alerta e CTA `Registrar Intervenção`
- **Logs / Audit history:** entries S4 com `alert_id`, `user_id`, `action`, `details`, `timestamp`
- **Telemetria:** S1a (click/registro), S2 (estado), S5 (auth/session errors) opcional
- **UX/Feedback:** skeletons, toasts, tooltips, toasts de erro/sucesso

---

## 🔍 Diagnóstico de lacunas (por elemento)
- **Cards:** não clicáveis para contexto; falta badge de severidade e SLA.
- **CTA Intervir:** abre apenas um alert simples; sem modal, sem histórico, sem rastreabilidade.
- **Severidade:** não persistida no payload; sem sugestões de ação (tooltip).
- **Histórico / Audit log:** inexistente ou difícil de consultar; ações não rastreadas para compliance.
- **Roteamento:** falta rota persistente (`/alerts/<alert_id>`) para bookmarking e auditoria.
- **Permissões / Roles:** ausência de fluxos diferenciados (instrutor vs admin) e validação 403 clara.
- **Feedback UX:** ausência de skeletons ou toasts; tempos de carregamento/erro não comunicados.

---

## 💡 Sugestões de melhoria (por elemento)
- **InterventionModal** (principal): severity, alert_history, contexto (curso/aula/usuário), CTAs: `Registrar Intervenção`, `Delegar`, `Resolver`.
- **Badge + Tooltip:** cores consistentes (Alta=red, Média=amber, Baixa=green) com texto e sugestão rápida de ação.
- **Audit log:** gravar todas ações em S4 e permitir listagem no modal; exportável para compliance.
- **Roteamento:** rota permanente `/alerts/<alert_id>` + openable modal, deep-linkable.
- **Roles:** diferenciar ações visíveis/permitidas (instrutor pode `Intervir`, admin pode `Escalar/Resolver/Delegar`).
- **UX polish:** skeletons para carregamento, toasts para sucesso/erro, inline validation para permissões.
- **Telemetria:** emitir S1a ao abrir modal e ao submeter `Registrar Intervenção`; S2 ao mudar estado do alerta; S4 ao gravar histórico.

---

## 🔧 Plano de implementação detalhado

### Backend (APIs & payloads)
- Enriquecer payload de alertas (ex.: `/api/v1/cognition/alerts/`):
  - severity: enum {high, medium, low}
  - context: {course_id, lesson_id, item_id, user_id}
  - alert_history: [{actor_id, action, details, timestamp}]
  - sla_deadline, created_at, status
- Endpoints novos/alterados:
  - GET `/api/v1/cognition/alerts/` (lista com severity & context)
  - GET `/api/v1/cognition/alerts/<alert_id>/` (detalhe + alert_history)
  - POST `/api/v1/cognition/alerts/<alert_id>/interventions/` (grava ação — escreve S4)
  - Audit log/storage: garantir S4 append-only e busca por `alert_id`.
- Events:
  - Emitir S1a on `intervention.create` with {alert_id, user_id, action, timestamp}
  - Emitir S2 on alert state change {alert_id, prev_state, new_state}
- Permissions:
  - Validate roles on server (403 on unauthorized actions)

### Frontend
- Cards: tornar clicáveis → open `/alerts/<alert_id>` route and modal.
- Alert card UI:
  - Show severity badge, created_at, SLA progress bar, CTAs (primary: Intervir Agora)
- `InterventionModal`:
  - Header: alert title + severity badge + breadcrumbs (Course > Lesson > Item)
  - Body: alert detail, alert_history (S4), suggested actions tooltip
  - Footer: CTAs (`Registrar Intervenção` + optional `Delegar` / `Resolver`)
  - Optimistic UI: update card state on success + show toast
- UX components: skeletons during load, tooltips on severity, toasts for success/error
- Telemetry: capture and send S1a, S2 events to analytics service
- Routing: ensure permalink `/alerts/<alert_id>` opens modal in list or standalone page

### UX Research & QA
- UX: microtests (3 users — instructor, admin, observer) to validate clarity of severity, action placement, and role differences
- QA: E2E tests for modal open, register intervention, audit log write, and unauthorized access (403)
- Performance: test modal open time ≤300ms (SSR or prefetch suggestions)

---

## ✅ Critérios de validação
- Modal abre e exibe contexto em ≤300ms (medir em ambiente de staging)
- `Registrar Intervenção` grava entrada em audit log (S4) e atualiza card + history
- Evento S1a emitido com payload {alert_id, user_id, action, timestamp}
- Badge e tooltip mostram corretamente `severity` (cor + texto)
- Permissões: ações não permitidas retornam 403 e UI mostra mensagem clara
- Cobertura E2E para fluxo principal (abrir modal → registrar intervenção)

---

## 📊 Impacto esperado nos KPIs
- Redução do tempo médio para primeira intervenção (TTR)
- Aumento da taxa de resolução dentro do SLA
- Melhoria na rastreabilidade e compliance (auditability)
- Melhoria na confiança do instrutor para ações corretivas

---

## 📈 Telemetria mapeada
- **S1a**: clique em `Intervir Agora`, submit de `Registrar Intervenção` — payload: {alert_id, user_id, action, timestamp}
- **S2**: mudança de estado do alerta — {alert_id, prev_state, new_state, timestamp}
- **S4**: audit log entries — stored server-side and queryable
- **S5** (opcional): auth/session errors on attempt of action

---

## ✨ Novas funções sugeridas (resumo)

| Nova Função | Objetivo | Benefício | Elementos Críticos | KPIs | Plano | Prioridade |
|---|---:|---|---|---|---|---|
| Quick Actions Presets | Sugerir ações por severity | Reduz TTR, guia o usuário | Badge, Tooltip, Modal CTA | TTR ↓, Resolução ↑ | Backend: map preset → Frontend: show suggestions | Alta |
| Delegação por fila | Permitir delegar alerta para role/queue | Distribui carga, acelera resolução | Modal, permissions, API | Resolução ↑, SLA compliance | Média |
| SLA progress & Escalation | Mostrar progress bar e escalonamento automático | Prevent SLA breach | Card, scheduler, backend escalation | SLA violations ↓ | Alta |
| Audit report export | Exportar histórico para compliance | Facilita auditoria | API, UI Export CSV | Compliance KPIs | Média |

---

## 🔁 Plano de rollout (sprint-ready)
1. Sprint 1 (Backend): expandir schema, endpoints de detail/history, emitir S1a/S2
2. Sprint 2 (Frontend): implement card badges, routing `/alerts/<id>`, basic modal
3. Sprint 3 (Frontend): add audit history view, CTAs, optimistic updates, telemetry
4. Sprint 4 (QA/UX): microtests, E2E, perf tuning (modal ≤300ms), docs

---

## 📋 Tickets sugeridos (resumo)
| key | title | labels | assignee |
|---|---|---:|---|
| ALERT-ENRICH | ENRICH: adicionar severity/context ao payload de alertas | backend,enhancement,high |  |
| ALERT-FEAT-MODAL | FEAT: modal de intervenção com registro de ação | frontend,feature,high |  |
| ALERT-ROUTE | DOC: roteamento permanente `/alerts/<alert_id>` e deep-linking | frontend,docs |  |
| ALERT-AUDIT | FEAT: implementar audit log (S4) e API de listagem | backend,feature,high |  |
| ALERT-TELEMETRY | TELE: emitir S1a/S2 em ações críticas | infra,telemetry |  |
| ALERT-UX | UX: microtests com instrutor/admin e ajustes | ux,research |  |

Os tickets acima foram exportados para **docs/planning/02-alerts-tickets.csv** (gerado automaticamente).

---

## ✅ Recomendações de UX e Feedback Visual
- **Skeletons**: placeholder de card e modal durante fetch
- **Toasts**: sucesso/erro (ex.: “Intervenção registrada” / “Permissão negada”)
- **Breadcrumbs**: Course > Lesson > Item no header do modal
- **Badge**: cores consistentes e tooltip explicativo
- **CTA**: `Registrar Intervenção` como botão primário com analytics hook (S1a)

---

## Status de implementação (proposta)
| Fluxo/Função | Elemento Crítico | Lacuna | Sugestão | Plano de Implementação | Impacto KPI | Prioridade | Telemetria | Status Implementação |
|---|---|---|---|---|---|---|---|---|
| Intervention Modal | Modal, history | Sem modal/context | `InterventionModal` com history | Backend + Frontend sprints 1-3 | TTR ↓, Resolução ↑ | Alta | S1a, S4 | Proposed |
| Severity badging | Cards | Sem badge | Badge + tooltip | Frontend sprint 2 | TTR ↓ | Alta | S1a | Proposed |
| Audit log | History | Sem histórico persistente | S4 append-only + UI | Backend sprint 1 + 3 | Compliance ↑ | Alta | S4 | Proposed |

---

## 📌 Anexo: CSV de Tickets
O CSV completo foi criado em `docs/planning/02-alerts-tickets.csv`.

---

## Próximos passos
1. Priorizar tickets com squad (1-2 sprints para MVP)
2. Implementar backend schema + API (Sprint 1)
3. Implementar modal + routing e testes E2E (Sprint 2-3)
4. UX microtests e performance tuning (Sprint 4)

---

*Nota:* Se quiser, posso abrir issues automáticas com os tickets acima e atribuir prioridades/assignees — diga quem deve ser notificado. 👇


## 📋 Relatório de Progresso (template)
| Data Início | Data Conclusão | Responsável | KPI Observado | Telemetria | Status |
|---|---|---|---|---|---|
| 2026-01-20 | 2026-01-27 | Nome do Eng/PO | TTR (médio) | S1a,S2,S4 | Em progresso |

---

*Última atualização: 2026-01-14 — autor: Product/UX Arch*