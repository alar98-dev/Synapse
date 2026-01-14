# INT-001 — Telemetry: Define S1a–S4 Event Schema and Registry

**Título:** Telemetry — Definir schema canônico para S1a/S2/S3/S4 e registrar eventos

**Descrição:**
- **Contexto:** Existem divergências no naming e payloads de eventos entre módulos. Precisamos de um registry canônico e contract tests para evitar drift e garantir correlação de eventos across modules.
- **Comportamento atual:** Eventos S1a/S2/S3/S4 definidos de forma ad-hoc por módulo (ex.: `s1a.material_action` vs `s1a.submission.create`). Falta um campo `correlation_id` padronizado e regras de sampling para eventos de alta cardinalidade.
- **Comportamento esperado:** Ter um registry (JSON/Markdown) com eventos nomeados por convenção (`s1a.{entity}.{action}.v1`), schema JSON para cada evento (required fields: `user_id`, `timestamp`, `correlation_id`, plus optional ids) e contract tests que rodem no CI.

**Passos de implementação:**
1. Backend: definir schema e publicar registry (docs + JSON Schema). Definir topic/kafka contract se aplicável.
2. Frontend: integrar SDK de telemetria com helpers para `emit(event, payload)` que validam schema e propagam `correlation_id` (fallback enqueue on offline).
3. Infra: configurar sampling rules no collector (e.g., 0.1% progress events), e definir retention/alerting de alta cardinalidade.
4. QA: escrever contract tests que validem payloads em PRs e criar testes de integração que simulem end-to-end flows.

**Dependências:** Nenhuma (mas reusado por todos os módulos).  

**Critérios de aceitação:**
- Registry publicado em `docs/planning/telemetry_registry.md` com exemplos e JSON Schemas.  
- Contract tests no CI passam; PRs que enviem eventos que não atendam ao schema falham o check.  
- SDK/Helper validated and used in at least 2 modules (Dashboard + Alerts) in a quick proof-of-concept.

**Telemetria mapeada:** Este ticket define as convenções e validações para todos os eventos S1a–S4.  

**Estimativa (story points):** 5  
**Responsável:** telemetry-lead  
**Prioridade:** Alta
