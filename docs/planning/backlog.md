# Backlog sugerido — Planejamento Instrutor/Admin

| ID | Título | Fluxo | Prioridade | Dependência | Estimativa (SP) | Responsável | Status | Aceitação |
| --- | --- | --- | --- | --- | ---: | --- | --- | --- |
| PL-001 | Modal de Insights do Dashboard | Dashboard | Alta | /core/dashboard/insights/ | 8 | Frontend Team (Lead: @frontend-lead) | Pendente | Modal abre e direciona para alerta/curso, evento S1a emitido |
| PL-002 | Enrich `/cognition/sessions/` + Sessões clicáveis | Dashboard / Alertas | Alta | `/api/v1/cognition/sessions/` | 5 | Backend Team (Lead: @backend-lead) | Pendente | Payload inclui `session_id`/`story_id`/`context`/`severity` e cards tornam-se clicáveis |
| PL-003 | Intervention Modal + registro (audit) | Alertas | Alta | alert_history + chat system | 8 | Frontend (Modal) + Backend (audit) (Lead: @product-owner) | Pendente | Modal grava intervenção no S4, atualiza card e notifica dashboard |
| PL-004 | Histórico de submissões + streaming logs | Aula/Submissão | Alta | `/submissions/` + storage/stream | 13 | Backend Team (Lead: @backend-lead) | Pendente | Histórico e logs disponíveis; streaming funcional, `submission_id` persistido |
| PL-005 | Breadcrumb + Badge Tracker (global) | UX / Dashboard / Cursos | Média | design tokens + routing | 5 | Frontend Team (Lead: @frontend-lead) | Pendente | Componente global de breadcrumb com badges de IDs; copy-state disponível |

> Observação: substitua `@frontend-lead`, `@backend-lead`, `@product-owner` por responsáveis reais ao criar os tickets no tracker.

> Nota: Antes de mover um ticket para sprint, preencha o campo `Responsável` com o owner (nome/alias) e assegure que o ticket referencia o `correlation_id` requirement e o Telemetry Schema Registry (INT-001).