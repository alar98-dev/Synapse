# Planejamento Estruturado — Dashboard (Etapa 1)

## Resumo do Módulo (padrão)

> Nota: Todos os eventos emitidos por este módulo devem incluir `correlation_id`. Preencher o campo `Responsabilidade` com nome/alias do owner antes de mover para sprint.


| Campo | Descrição |
| --- | --- |
| Módulo | Dashboard |
| Elementos críticos | AI Insight Hero (CTA “Detalhes completos”); Cards métricos (KPIs); Sessões Recentes (cards clicáveis); Atividade Recente (logs) |
| Lacuna | CTAs inativos; Sessões Recentes não clicáveis; Ausência de breadcrumbs; Falta de badges de severity e skeletons |
| Sugestão | Ativar `DashboardInsightModal`; transformar Sessões em `SessionCard` clicáveis; adicionar breadcrumbs, badges, tooltips, skeletons e toasts (FE/BE/UX/QA) |
| Responsabilidade | Frontend / Backend / UX / QA |
| Impacto | Redução do tempo médio de ação em alertas; aumento de engajamento em CTAs do Dashboard |
| KPI | Tempo médio para ação; taxa de resolução; CTR em CTAs |
| Prioridade | Alta |
| Telemetria | S1a: `s1a.dashboard.insight.click.v1` {user_id, session_id, story_id, correlation_id}; S2: card state {card_id, open/closed, severity}; S4: audit log entries (persisted) |

**Objetivo:** Transformar o Dashboard em uma view acionável e rastreável, integrando CTAs ativos, breadcrumbs, badges de prioridade e links diretos para Alertas/Cursos/Aulas.

## 1. Elementos Críticos
| Elemento | Observações |
| --- | --- |
| AI Insight Hero (CTA “Detalhes completos”) | CTA inativo, sem breadcrumbs, sem link para alerta/curso |
| Cards métricos (KPIs) | Falta ligação direta com cursos/alertas, feedback de carregamento insuficiente |
| Sessões Recentes (cards clicáveis) | Botão refresh apenas reinicia fetch; não há badge de prioridade ou CTA contextual |
| Atividade Recente (logs) | Não há ligação direta com alerta/curso; falta breadcrumbs e tooltips claros |

## 2. Diagnóstico de Lacunas
- CTAs inativos no Hero e botão “Ver logs” → dead-end e frustração.
- Sessões Recentes não clicáveis → impossível acessar contexto do alerta/curso.
- Ausência de breadcrumbs → navegação pouco clara.
- Falta de badges de severity e tooltips → difícil priorizar ações.
- Carregamento sem skeletons → feedback visual insuficiente.

## 3. Sugestões de Melhoria
- Hero: ativar CTA abrindo modal com insights e ações — “Ver logs”, “Ir para alerta/curso”.
- Sessões Recentes: transformar em cards clicáveis, incluir badge de severity e tooltip explicativo.
- Breadcrumbs: implementar padrão "Dashboard > Alertas/Cursos > [Curso/Aula]".
- Skeletons & Toasts: criar skeletons para carregamento e toasts para erros (401, timeout, sessão expirada).

## 4. Plano de Implementação
| Etapa | Responsável | Detalhes |
| --- | --- | --- |
| Backend | Equipe Backend | Expor endpoint `/core/dashboard/insights/` com `story_id` e `session_id` e enriquecer `/cognition/sessions/` com `context` (course_id/lesson_id) e `severity` |
| Frontend | Equipe Frontend | Criar `DashboardInsightModal` (modal + breadcrumbs + CTAs ativos), transformar Sessões em cards clicáveis, adicionar badges e tooltips, skeletons e toasts |
| UX | UX Designer | Mock do modal, fluxo de breadcrumbs e teste com 3 instrutores para validar clareza e CTA |
| QA | QA | Validar skeletons, toasts, interceptação de 401/timeout; E2E do modal e navegação para alerta/curso |
| Validação | QA + UX | Testes E2E: abertura do modal, navegação para alerta/curso e telemetria emitida |

## 5. Dependências / Pré-requisitos
- Endpoint `/core/dashboard/insights/` disponível
- Payloads com `story_id`, `session_id`, `course_id`, `lesson_id`
- Tokens de autenticação estáveis e política de retry

## 6. Critérios de Validação e Teste
- Modal abre em ≤250ms (com cache)
- Modal mostra `story_id` e link funcional para Alertas/Cursos
- Evento S1a emitido no clique com payload `{session_id, story_id, user_id}`
- Skeletons visíveis durante carregamento e toasts em falhas (401/timeout)

## 7. Impacto no KPI
- Reduz tempo médio de ação em alertas (+20–40% estimado)
- Aumenta engajamento em CTAs do Dashboard
- Melhora rastreabilidade de decisões e ações realizadas

## 8. Prioridade
- Alta

## 9. Telemetria Afetada
| Telemetria | Evento | Dados |
| --- | --- | --- |
| S1a | Clique no CTA | `{session_id, story_id, user_id}` |
| S2 | Estado do card | `open/closed`, `severity` |
| S4 | Audit log | Interação com insight/modal (registro persistido) |

## 10. Tickets sugeridos
- [ ] ATIVAR: Modal de Insights do Dashboard (backend + frontend) — incluir schema de retorno com `story_id`/`session_id` (PL-001)
- [ ] ENRICH: Adicionar `session_id`/`story_id` e `context` no payload de `/cognition/sessions/` (PL-001)
- [ ] FEAT: Transformar Sessões Recentes em cards clicáveis com badges de severity e breadcrumbs (PL-001)
- [ ] QA: Testes E2E para modal e navegação; validação de telemetria S1a/S4

---

## 11. Análise detalhada de fluxos críticos (visão executiva)
A tabela abaixo descreve os fluxos do sistema que impactam diretamente KPIs, engajamento e capacidade de tomada de decisão, com lacunas identificadas e plano de implementação rastreável.

| Fluxo/Função | Elemento Crítico | Lacuna | Sugestão | Plano de Implementação | Impacto KPI | Prioridade | Telemetria | Status Implementação |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Alertas → Ação (Alert → Investigate → Resolve) | CTA "Ir para alerta", badge de severity, breadcrumbs | CTA dead-end, sem contexto (course/lesson), sem prioridade visual | CTA ativa que abre `DashboardInsightModal` com links para alerta/curso/aula, badge severity (low/medium/high/critical) e sugestão de ação | Backend: endpoint `/core/dashboard/insights/?alert_id=` retornando `{alert_id, story_id, session_id, context, severity, recs}`. Frontend: `AlertCard`, `DashboardInsightModal`, breadcrumbs padrão. UX: mock do fluxo; QA: E2E que valida navegação e S1a/S2/S4 | Reduz tempo médio de ação; aumenta taxa de resolução | Alta | S1a (clique CTA), S2 (estado card), S4 (audit log) | Planejado (PL-001)
| Sessões/Stories → Contextualização de curso/aula | Sessões recentes, botão refresh | Cards não clicáveis; falta `course_id`/`lesson_id`/`severity` no payload | Transformar em cards clicáveis; incluir tooltip com resumo, badge de severity e CTA "Ir para" | Backend: enriquecer `/cognition/sessions/` com `{session_id, story_id, course_id, lesson_id, severity, timestamp, snippet}`. Frontend: `SessionCard` clicável, skeleton, tooltip, debounce no refresh. UX: teste com instrutores. QA: E2E do card para abrir contexto. | Aumenta engajamento CTAs; reduz dead-ends | Alta | S2 (estado card), S1a (clique), S4 | Planejado (PL-001)
| KPI Cards (KPIs Dashboard) | Cards métricos, indicadores em tempo real | Sem link para causa, sem refresh incremental, sem feedback de loading | Tornar cards acionáveis; on-hover show drilldown; incremental streaming (delta) + skeletons | Backend: endpoints agregados `/core/dashboard/kpis/` com cache e delta. Frontend: `MetricCard` com drilldown modal e chart pequeno. UX: priorizar clarity. QA: testes de performance e carga | Melhora tomada de decisão; reduz tempo para identificar causa | Média | S3 (kpi_update), S1a (drilldown) | Planejado
| Logs / Audit trail | Lista de ações, ver logs por item | Logs não vinculados a ações UI; sem persistência de decisão nos eventos | Linkar ações do modal a `AuditLog` (persistido), adicionar botão "Registrar ação" no modal | Backend: endpoint `/core/audit/` para gravação de logs; Frontend: `AuditAction` com confirmation. QA: validação de persistência e consulta | Aumenta rastreabilidade; compliance | Alta | S4 (audit log), S1a (action) | Planejado
| Autenticação & Sessões | Erros 401, timeout, session-expired | Feedback técnico confuso; interrupções sem recovery | Interceptador global: mostrar toast claro, aplicar retry com backoff e redirect para login com estado preservado | Backend: definir 401 payload padrão. Frontend: central interceptor que emite evento `auth_401` e toast com CTA de re-login. QA: validar fluxos de timeout e refresh token | Reduz fricção; reduz perda de ações | Alta | S5 (auth_error), S4 (session events) | Planejado
| Notificações e toasts | Erros, confirmações | Falta de toasts consistentes e interception de erros | Implementar `ToastService` e padrões (success/info/warn/error) e skeletons durante load | Frontend: `ToastService`, global error handler; UX: padrão visual. QA: tests unitários de toasts e E2E para mensagens | Melhora feedback; reduz confusão | Média | S4 (ui_notice), S1a (dismiss) | Planejado

---

## 12. Especificações por elemento crítico (resumo executável)
Para cada elemento crítico, especificações mínimas e entregáveis por disciplina:

- **Hero (AI Insight)**
  - Backend: `/core/dashboard/insights/?story_id=` retornando `{story_id, session_id, summary, context:{course_id,lesson_id}, severity, actions:[{id,label,href}]}`
  - Frontend: `DashboardInsightModal` com header breadcrumb, CTA "Ir para alerta/curso", botão "Registrar ação" (audit), skeleton e fallback. Emitir S1a no clique, S4 no registro.
  - UX: mock do modal (desktop/mobile), fluxos de decisão, teste com 3 instrutores.
  - QA: unit, E2E (abrir modal → navegar → audit log), performance (≤250ms cached).

- **Sessões Recentes (cards)**
  - Backend: ajustar `/cognition/sessions/` para incluir `context` e `severity` e endpoint de detalhe `/cognition/sessions/{id}/`.
  - Frontend: `SessionCard` clicável; badge severity, tooltip `explain()`, skeletons, debounce refresh e retry.
  - Telemetria: S1a clique, S2 estado do card.

- **Cards métricos (KPIs)**
  - Backend: `/core/dashboard/kpis/` com caching e campo `drilldown_url`.
  - Frontend: `MetricCard` com drilldown modal, chart pequeno e link para lista detalhada.
  - Telemetria: S3 kpi_update, S1a drilldown.

- **Logs & Audit**
  - Backend: `/core/audit/` para persistência; schema `{actor_id, action, target_type, target_id, metadata, timestamp}`.
  - Frontend: botões de "Registrar ação" que POSTam para `/core/audit/` e exibem confirmações.
  - Telemetria: S4 audit log.

## 13. Novas Funções sugeridas (priorizadas)
| Nova Função | Objetivo | Benefício | Elementos Críticos | KPIs Impactados | Plano de Implementação | Prioridade |
| --- | --- | --- | --- | --- | --- | --- |
| Dashboard Insight Modal (PL-INSIGHT) | Centralizar contexto e ações para cada insight | Acelera decisões; reduz dead-ends | Modal, CTAs, Audit log | Tempo médio de ação, taxa de resolução | Backend `/core/dashboard/insights/`, Frontend `DashboardInsightModal`, UX mock, QA E2E | Alta |
| Severity Badges & Tooltips (PL-BADGES) | Rápida priorização visual | Melhor priorização | Badges, tooltips, color tokens | Engajamento em CTAs, TAT (time to action) | Backend expose `severity`; Frontend badge component; UX tokens | Alta |
| KPI Drilldown & Live Delta (PL-KPI) | Ligação entre métrica e causa | Reduz time-to-root-cause | MetricCard, drilldown modal | Tempo para identificar causa | Backend streaming/delta; Frontend incremental updates | Média |
| Action Recorder / Quick Actions (PL-ACTION) | Ação em 1 clique com logging | Aumenta taxa de ação e rastreabilidade | Quick CTA, Audit log, Success toast | Taxa de execução de ações | Frontend quick action + POST /core/actions; Backend audit | Alta |
| Inbox de Alertas Prioritizada (PL-INBOX) | Lista filtrável por severity e SLA | Melhora foco e SLA | Filtered list, SLA timers, Escalation CTA | SLA compliance, resolução | Backend filtering; Frontend inbox view; QA escalations | Média |

---

## 14. Checklist de QA e Telemetria mínima (essencial)
- Unit tests para todos os novos componentes (`DashboardInsightModal`, `SessionCard`, `MetricCard`).
- E2E: abertura modal → navegação para alerta/curso → gravação em Audit Log.
- Performance: modal cached abre ≤250ms; KPI cards atualizam sem bloquear UI.
- Telemetria exigida por evento:
  - **S1a**: Clique em CTA/Drilldown `{session_id, story_id, user_id, target}`
  - **S2**: Estado do card `{card_id, open/closed, severity}`
  - **S3**: KPI update `{kpi_id, value, delta}`
  - **S4**: Audit `{actor_id, action, target, metadata}`
  - **S5**: Auth `{user_id, event: auth_error|timeout, metadata}`

## 15. Relatório de Progresso (template)
| Função / Correção | Data Início | Data Conclusão | Responsável | KPI Observado | Telemetria | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Modal Insights (PL-INSIGHT) | 2026-01-15 | 2026-02-05 | Frontend/Backend | TTA ↓ 25% | S1a, S4 | Em progresso |

---

*Para criar tickets no tracker, responda se prefere:*
- **CSV para importação** (eu gero o CSV com colunas: key, title, body, labels, assignee)
- **Rascunhos de issues** (eu abro PRs/Issues com template no repositório)

*Arquivo atualizado automaticamente.*