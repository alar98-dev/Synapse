# Status de Implementação — Planejamento Instrutor/Admin

> Nota operacional: preencher `Responsável` com owner (nome/alias) antes de iniciar o ticket em sprint; todos os eventos devem propagar `correlation_id` e usar o Telemetry Schema Registry (INT-001).

| Fluxo / Função | Elemento crítico | Lacuna | Sugestão | Plano de Implementação | Impacto KPI | Prioridade | Estimativa (SP) | Telemetria | Template aplicado | Status | Data Início | Data Conclusão | Responsável |
| --- | --- | --- | --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- |
| Dashboard | Detalhes completos | CTA inativo | Modal de insights | PL-001 | Tempo p/ ação | Alta | 8 | S1a/S4 | Yes (2026-01-14) | Pendente | 2026-01-14 |  | Frontend Team (@frontend-lead) |
| Dashboard / Alertas | Sessões Recentes | Não clicáveis | Cards clicáveis + badges | PL-002 | Tempo de resposta | Alta | 5 | S1a/S2/S4 | Yes (2026-01-14) | Pendente | 2026-01-14 |  | Backend Team (@backend-lead) |
| Alertas | Intervention Modal | Sem modal/histórico | Modal + registro + route `/alerts/<id>` | PL-003 | Tempo de resposta | Alta | 8 | S1a/S4 | Yes (2026-01-14) | Pendente | 2026-01-14 |  | Product / Frontend (@product-owner / @frontend-lead) |
| Aula | Histórico de submissão | Sem histórico | Histórico + streaming | PL-004 | Taxa de sucesso | Alta | 13 | S1a/S2/S4 | Yes (2026-01-14) | Pendente | 2026-01-14 |  | Backend Team (@backend-lead) |
| Global | Breadcrumb + Badge Tracker | Falta padrão global | Componente global de breadcrumb com badges | PL-005 | Rastreabilidade | Média | 5 | S1a/S4 | Yes (2026-01-14) | Pendente | 2026-01-14 |  | Frontend Team (@frontend-lead) |

> Atualize esta tabela conforme tickets forem iniciados e concluídos. Use os IDs do backlog (coluna "Plano de Implementação") e substitua `@<owner>` por responsáveis reais.