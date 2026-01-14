# Feature: Dashboard API & Student Dashboard MVP

**Módulo:** dashboard / frontend
**Prioridade:** Alta
**Labels:** frontend, backend, api, ui, high

## Objetivo
Criar endpoint agregado `/api/v1/users/{id}/dashboard` e a tela `Student Dashboard` (React) com skeletons, integração de telemetria e CTAs para retomar exercícios.

## Descrição técnica
- Backend: implementar viewset/endpoint que agrega `progress`, `upcoming_events`, `last_submissions`, `enrolled_cohorts` e `notifications_summary`.
- Frontend: criar página React com componentes reutilizáveis (ProgressCard, UpcomingList, SubmissionsList) e skeletons/loading states.
- Telemetria: emitir `dashboard_view` ao carregar e `cta_click_resume` ao clicar em retomar exercício (usar `correlation_id`).

### Payload exemplo (GET)
```json
{
  "progress": {"percent": 42, "xp": 1200},
  "upcoming": [{"type":"lesson","id":123,"starts_at":"..."}],
  "last_submissions": [{"id":"sub-1","status":"success","score":85}],
  "cohorts": [{"id":1,"name":"Cohort A"}]
}
```

## Checklist de implementação
- [ ] Backend: rota `/api/v1/users/{id}/dashboard` com caching opcional
- [ ] Frontend: React page + components + skeletons
- [ ] E2E smoke: login -> acessar dashboard -> clicar CTA resume
- [ ] Instrumentar eventos `dashboard_view`, `cta_click_resume` com `correlation_id`
- [ ] QA: acessibilidade, mobile responsiveness

## Dependências
- `submissions` API (last_submissions)
- `courses` / `cohorts` APIs
- Telemetry ingest endpoint

## Critérios de aceite
- Endpoint responde < 300ms (cache hit) para usuário com dados médios
- Skeletons exibidos e substituídos por conteúdo carregado
- Evento `cta_click_resume` aparece no sistema de telemetria com `correlation_id`

## Notas
O uso de mocks/fallbacks é proibido para aceitação: o frontend deve consumir APIs integradas em `staging` para validação. Use o contrato OpenAPI aqui definido para gerar clientes tipados (OpenAPI -> types) e validar o contrato contra o backend em ambiente de integração.
