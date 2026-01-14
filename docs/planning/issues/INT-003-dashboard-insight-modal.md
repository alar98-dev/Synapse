# INT-003 — Dashboard Insight Modal (PL-INSIGHT)

**Título:** Dashboard — Implementar `DashboardInsightModal` com CTAs ativos e deep links

**Descrição:**
- **Contexto:** CTAs no Hero estão inativos e sessões não são clicáveis, causando dead-ends e perda de contexto para ações de intervenção.
- **Comportamento atual:** Modal/CTA inativo; sessão não oferece link direto para alerta/curso.
- **Comportamento esperado:** `DashboardInsightModal` que exibe `story_id`, `session_id`, resumo, links para Alert/Course/Lesson, CTAs (`Ir para alerta/curso`, `Registrar ação`) e emite S1a/S4 ao interagir.

**Passos de implementação:**
1. Backend: endpoint `/core/dashboard/insights/?story_id=` returning `{story_id, session_id, summary, context:{course_id,lesson_id}, severity, actions}`.  
2. Frontend: `DashboardInsightModal` component; SessionCard clickable; badges, tooltips, skeletons; emit S1a on CTA; call Audit POST on registered action.  
3. UX: modal design + breadcrumbs pattern; test with instructors (3 users).  
4. QA: unit + E2E (open modal → navigate to alert/course → audit entry written).  

**Dependências:** INT-002 (Audit Service) for writing actions, INT-001 for telemetry schemas.  

**Critérios de aceitação:**
- Modal opens ≤250ms (cached); emits `s1a.dashboard.insight.click.v1` with `{user_id, session_id, story_id, correlation_id}`.  
- `Registrar ação` writes S4 audit entry.  

**Estimativa (story points):** 8  
**Responsável:** frontend-lead  
**Prioridade:** High
