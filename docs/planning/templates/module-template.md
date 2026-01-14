# Template Padrão de Módulo — Planejamento

Use este template para padronizar a documentação de cada módulo/etapa do produto. Copie este bloco para o topo do arquivo de planejamento de cada módulo e preencha os campos.

## Resumo do Módulo (padrão)

| Campo | Descrição |
| --- | --- |
| Módulo | Nome do módulo (ex.: Dashboard, Alerts, Courses) |
| Elementos críticos | Componentes essenciais / fluxos-chave (ex.: CTA, hero, cards, filtros, uploads, logs) |
| Lacuna | Problema detectado ou incompletude (ex.: CTAs inativos, falta de audit logs) |
| Sugestão | Solução proposta (Frontend / Backend / UX / QA ações) |
| Responsabilidade | Equipe responsável / dono do módulo (ex.: frontend-team, backend-team, ux) |
| Impacto | Descrição qualitativa do impacto (ex.: reduz TTR, aumenta conversão) |
| KPI | Métrica(s) específicas afetadas (ex.: taxa de conversão, TTR, engajamento) |
| Prioridade | Alta / Média / Baixa — baseada em impacto & dependências |
| Telemetria | Eventos S1a–S4 relevantes, campos obrigatórios (`correlation_id`, `user_id`, `timestamp`) e regras de amostragem |

---

### Instruções de uso
- Sempre inclua `correlation_id` nas ações que cruzam módulos.  
- Preencha `Elementos críticos` com 3–6 itens e associe responsabilidades (FE/BE/UX/QA).  
- Em `Telemetria`, registre exemplos de payload mínimo para S1a/S2/S3/S4 e indique se sampling é necessário.  
- Atualize a seção `Prioridade` conforme mudanças no roadmap ou dependências.

---

### Exemplo (Dashboard)
| Campo | Descrição |
| --- | --- |
| Módulo | Dashboard |
| Elementos críticos | Hero CTA, Session cards, KPI cards |
| Lacuna | CTAs dead-end; Sessões não clicáveis; falta breadcrumbs |
| Sugestão | DashboardInsightModal; SessionCard clicável; badges; skeletons (FE/BE/UX/QA) |
| Responsabilidade | Frontend / Backend / UX / QA |
| Impacto | Reduz TTA; aumenta engajamento de CTAs |
| KPI | Tempo médio por ação; taxa de resolução; CTR de CTAs |
| Prioridade | Alta |
| Telemetria | S1a: `s1a.dashboard.insight.click.v1` {user_id, session_id, story_id, correlation_id}; S4: audit entries on actions |
