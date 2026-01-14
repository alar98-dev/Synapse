# Planning Audit — Melhorias transversais (Visão de Especialista)

**Objetivo:** Mapear pontos de melhoria em todo o planejamento (PL-001..PL-005 e arquivos correlatos), priorizando clareza de requisitos, testabilidade, telemetria, riscos e entrega incremental.

## Sumário de melhorias prioritárias
1. **Clarificar critérios de aceitação (AC) por ticket** — ACs atuais são funcionais; adicione ACs mensuráveis (latência, payload fields, telemetria esperada).
2. **Estimar riscos e dependências** — vincular dependências externas (Stripe, storage, chat) a cada ticket e marcar risco: alto/médio/baixo.
3. **Definição de rollout incremental e feature flags** — para itens com impacto crítico (PL-001, PL-003, PL-004), planejar rollout em canary/small subset antes do release amplo.
4. **Plano de monitoramento pós-release** — definir dashboards (Grafana/Metabase) para KPIs target e alertas operacionais (latency, error-rate, telemetry missing).
5. **Test strategy padronizada** — unit tests, contract tests (backend), E2E flows (cypress/playwright), performance smoke tests e testes de recuperação de falha.
6. **Telemetria e schemas** — especificar schema de eventos S1a/S2/S3/S4 com exemplos JSON e sample topics para o time de infra (Kafka/Events).
7. **Segurança e permissões** — validar fluxos com 401/403 handling e incluir testes automáticos para roles (Instrutor/Admin/Aluno).
8. **Acessibilidade e i18n** — validar elementos novos (modals, badges, tooltips) para WCAG e strings prontas para tradução.
9. **Documentação de API e contrato** — publicar OpenAPI snippets para endpoints novos e mudanças (`/core/dashboard/insights/`, `/submissions/` streaming).
10. **Observability de logs persistidos (S4)** — políticas de retenção, export e acesso para suporte (permissões) e playbooks para investigação.

## Ações concretas (por item)
- PL-001 (Modal Insights):
  - Adicionar ACs: {latency ≤250ms, S1a fired with payload fields, modal link works in 100% of cases}.
  - Criar feature flag `dashboard.insights.v1` com canary rollout (5% users → 25% → 100%).
  - Criar dashboard: "Dashboard Insights Usage" (CTR, modal open latency, error rate).
  - Owners: Frontend, Backend, Product, QA.

- PL-002 (Enrich sessions):
  - Definir contract tests entre backend/frontend (e.g., Pact) para `context` payload.
  - AC: `severity` values standardized (critical/high/medium/low) and documented.
  - Add sample payloads to `docs/planning/telemetry.md`.

- PL-003 (Intervention Modal):
  - Incluir playbook de segurança (who can intervene), audit log format S4 e retention policy.
  - QA scenario: user without permission attempts action → tooltip + 403 test.

- PL-004 (Submissions history):
  - Definir storage retention (S3 lifecycle) e schema for submission history.
  - Implement streaming contract (SSE/WS) and fallback polling with incremental backoff.
  - Performance tests: ensure history load ≤500ms for last 10 submissions.

- PL-005 (Breadcrumbs):
  - Global component with props: {trail: Array, ids: Object, copyState: boolean} and unit tests.
  - Document accessibility focus and keyboard navigation.

## Templates para ACs (exemplos)
- "Ao clicar no CTA `Detalhes completos`, abrir modal em ≤250ms e emitir evento S1a com {session_id, story_id}. Se o payload estiver faltando, exibir alerta e registrar erro S3."

## Riscos e Mitigações rápidas
- Dependências externas (Stripe, AI provider) → Mitigar com stubs/mocks e circuit breakers.
- Latência no modal → cache responses (short TTL) + progressive rendering.
- Segurança: ações críticas sem permissão → bloquear e auditar, mensagem clara para o usuário.

## Métricas de sucesso (hipóteses)
- Redução MTTA em 20–40% (target PL-001/PL-003) em 4 semanas após deploy.
- Aumento CTR dos CTAs do dashboard em +15% no primeiro mês.
- Diminuição do tempo médio para o próximo debug (logs) em 30% com S4 persistido.

## Próximos passos recomendados
1. Adicionar ACs e estimativas em cada ticket (feito: PL-001..PL-005).  
2. Agendar 30min sync com frontend/backend/product para alinhar dependências e donos.  
3. Criar tickets menores (subtasks) por ticket grande (ex: PL-004 → stream API, storage, frontend history UI, E2E).  
4. Preparar CSV para import (posso gerar).  

---

*Arquivo criado automaticamente pelo especialista de planejamento — use como checklist para os tickets.*