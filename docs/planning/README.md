# Planejamento — Páginas Instrutor/Admin

Este diretório contém o planejamento estruturado por etapa, com arquivos separados por fluxo/feature, templates de ticket e um painel de acompanhamento.

Estrutura:
- 01-dashboard.md — Planejamento detalhado do Dashboard
- 02-alerts.md — Planejamento das Alertas/Intervenção humana
- 03-courses.md — Planejamento de Meus Cursos
- 04-course-detail.md — Planejamento do Detalhe do Curso
- 05-lesson-submission.md — Planejamento de Aula / Submissão
- 06-materials.md — Planejamento de Materiais
- 07-ai-center.md — Planejamento do AI Center
- 08-billing.md — Planejamento de Assinaturas (Billing)
- telemetry.md — Mapeamento S1a–S4 e instruções de rastreabilidade
 - INT-001-telemetry-schema.md — Telemetry schema registry & contract tests (INT-001)
- backlog.md — Backlog de tickets sugeridos para implementação
- implementation_status.md — Tabela de status de implementação
- templates/ticket-template.md — Template de ticket pronto para JIRA/GitHub
- templates/module-template.md — Template padronizado por módulo (preencha o bloco 'Resumo do Módulo' no topo de cada arquivo)

Como usar:
1. Revisar cada arquivo por fluxo, adaptar campos "Dependências" e "Critérios de Validação" conforme time.
2. Copiar os blocos de "Tickets Sugeridos" para o `backlog.md` e criar tickets no tracker escolhido.
3. Manter `implementation_status.md` atualizado com datas e responsáveis.

Observação: Este planejamento é derivado de `docs/instructor_admin_page_map.md` (a fonte original).