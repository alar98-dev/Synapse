# Feature: Telemetry Ingest & Schemas

**Módulo:** observability / telemetry
**Prioridade:** Alta
**Labels:** observability, telemetry, backend, high

## Objetivo
Implementar um endpoint central `POST /telemetry/events` (ou pub/sub) que valide eventos via JSON Schema/Protobuf, normalize campos (ex.: `correlation_id`, `user_id`, `timestamp`) e roteie para analytics pipeline (store + forwarding).

## Descrição técnica
- Criar app `telemetry` com endpoint `POST /telemetry/events` que valida payloads contra schemas (S1a, S2, S4 e outros definidos).
- Implementar background forwarder para enviar eventos para a store (e.g., Kafka / Redis stream / DB) e pipeline de agregação.
- Garantir idempotência e schema versioning (campo `schema_version`).
- Instrumentar ingest metrics: `telemetry_events_received_total`, `telemetry_events_failed_total`.

## Checklist de implementação
- [ ] Definir JSON Schema para S1a, S2, S4 e publicar em `docs/telemetry/schemas/`
- [ ] Implementar endpoint `POST /telemetry/events` com validação e rejection com 422
- [ ] Armazenamento temporário/forwarder para analytics
- [ ] Instrumentar métricas Prometheus
- [ ] Documentar integração para frontend e workers

## Dependências
- Analytics infra (Kafka / DB) — opcional inicialmente; pode persistir em Postgres
- Frontend e workers: acordar campos requeridos (usar `correlation_id`)

## Critérios de aceite
- Eventos válidos aceitos e gravados; inválidos retornam 422 com erro legível
- Métricas aparecem em Prometheus
- Frontend/worker conseguem enviar S1a/S2/S4 com sucesso em staging

## Notas
Começar com armazenamento em Postgres e forward para external pipeline em segunda fase. Garantir que `user_id` pode ser null para eventos anônimos.
