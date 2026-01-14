# Planejamento — Meus Cursos

## Resumo do Módulo (padrão)

| Campo | Descrição |
| --- | --- |
| Módulo | Meus Cursos |
| Elementos críticos | Botão "+ Criar novo curso"; Grid de `CourseCard` (Visualizar / Editar); Busca e filtros; Paginação/Infinite scroll; Badges de progresso |
| Lacuna | Criação/edição bloqueadas; Falta de paginação e agrupamento; Sem indicadores de progresso/coorte; Falta de S4 audit trail em mutações |
| Sugestão | Implementar CRUD endpoints (`/api/v1/courses/`), modais `CreateCourse`/`EditCourse`, paginação e persistência de filtros, `CourseCard` com progress % e badges; Gravar S4 em mutações (FE/BE/UX/QA) |
| Responsabilidade | Backend / Frontend / UX / QA |
| Impacto | Aumento no número de cursos publicados; redução de tempo até publicar; produtividade de instrutores |
| KPI | Novos cursos por mês; tempo até publicar; taxa de edição bem-sucedida |
| Prioridade | Alta |
| Telemetria | S1a: `s1a.course.create|edit|delete.v1` {course_id, user_id, action, correlation_id}; S2: state changes (draft→published); S4: audit trail for changes |

> Nota: Todos os eventos emitidos por este módulo devem incluir `correlation_id`. Preencher o campo `Responsabilidade` com nome/alias do owner antes de mover para sprint.

**Resumo:** Liberar criação/edição de cursos, melhorar filtros, adicionar paginação e indicadores de progresso nos cards.

## Elementos críticos
- Botão "+ Criar novo curso"
- Grid de cards (Visualizar / Editar)
- Busca e filtros (Todos / Publicados)

## Diagnóstico
- Criação/edição bloqueadas
- Falta de paginação e agrupamento
- Sem indicadores de progresso / badges de coorte

## Sugestões
- Habilitar CRUD com validações e workflow de publicação
- Adicionar paginação/infinite scroll e persistência de filtros (localStorage)
- Exibir badges de progresso (% concluído) e contadores de alunos/matrículas

## Plano de implementação
1. Backend: endpoints POST/PUT/DELETE em `/courses/` (validações, permissões)
2. Frontend: modal `CreateCourse` + `EditCourse`, paginação e filtros persistentes
3. UX: testes de usabilidade para fluxo de criação (3 iterações)
4. QA: cobertura de edge cases (permissões, uploads de imagens/metadados)

### Critérios de validação
- Criar curso com dados mínimos em ≤3 passos
- Editar curso atualiza card e telemetria S1a
- Filtro mantido após refresh/navegação

## Impacto no KPI
- Aumento de novos cursos publicados (KPI: novos cursos / mês)
- Melhor produtividade de instrutores (tempo até publicar)

## Prioridade
- Alta

## Telemetria
- S1a: criação/edição/exclusão de curso
- S2: estado (published/draft)
- S4: audit trail de mudanças

---

## Tickets sugeridos
- [ ] FEAT: Implementar POST/PUT/DELETE para `/courses/`
- [ ] FEAT: Modal de criação e edição de curso (inclui validações)
- [ ] ENH: Paginação + persistência de filtros

---

## Plano de implementação detalhado

### Backend
- Endpoints necessários:
  - GET `/api/v1/courses/` — listagem paginada com filtros (status, search, tags)
  - GET `/api/v1/courses/<course_id>/` — detalhe com `progress`, `students_count`, `cohort_badges`
  - POST `/api/v1/courses/` — criação (validações + permissões)
  - PUT `/api/v1/courses/<course_id>/` — edição parcial/total
  - DELETE `/api/v1/courses/<course_id>/` — remoção (soft-delete + audit)
  - POST `/api/v1/courses/<course_id>/publish/` — workflow de publicação (draft → published)
- Payloads (sugestão mínima):
  - { title, description, metadata: {language, level}, cover_image, modules: [{title, lessons[]}], visibility, state: enum(draft,published), owner_id }
  - Enriquecer listagem com `{progress_percentage, students_count, cohort_count, severity?}` quando aplicável
- Audit & Telemetry:
  - Gravar S4 entries para todas as mutações CRUD: {course_id, actor_id, action, details, timestamp}
  - Emitir S1a on create/edit/delete actions
  - Emitir S2 on state changes (published/draft)
- Permissões:
  - Permitir CRUD apenas para roles com permissão (`instructor`, `admin`) — 403 para violações
  - Validar ownership para edições (instructor pode editar seus cursos; admin pode editar todos)

### Frontend
- UI/UX components:
  - `CreateCourseModal` / `EditCourseModal` (multi-step opcional), com skeletons e validação inline
  - `CourseCard` clicável: mostra título, progress % (badge), students_count, badges de coorte, CTA `Editar` / `Visualizar`
  - Paginação/Infinite scroll com persistência de filtros em localStorage
  - Filtros: status (All/Published/Draft), search, tags, sort
  - Toasts para sucesso/erro e confirmation dialog para deletar
- Behaviour & Perf:
  - Prefetch detalhe ao hover/click para reduzir tempo de abertura (target: ação ≤300ms para abrir detalhe modal)
  - Optimistic UI updates para criação/edição (com rollback on fail)
- Telemetry hooks:
  - S1a: clicks on create/edit/delete, confirm publish
  - S3 (opcional): interactions with filters/sort/pagination

### UX Research & QA
- Microtests:
  - 3 users per persona (instructor, admin, observer) validate flow: create course in ≤3 steps, edit updates card, understand progress badge
- QA/E2E:
  - Tests: create course, edit course, delete (soft), publish workflow, filters persist after navigation
  - Edge cases: image upload errors, validation errors, 403/401 flows
  - Performance: measure modal open ≤300ms in staging (use prefetch where needed)

---

## Critérios de validação (ACEITAÇÃO)
- Criar curso com dados mínimos em ≤3 passos
- Edição atualiza card e dispara evento S1a
- Filtros e paginação persistem após refresh
- Skeletons e toasts exibidos em carregamento/erros
- Permissões: ações não permitidas retornam 403 e UI mostra mensagem clara

---

## Telemetria mapeada
- **S1a**: criação/edição/exclusão/publish — payload: {course_id, user_id, action, timestamp}
- **S2**: estado do curso (draft → published)
- **S3**: interação com filtros/pagination/sort (opcional)
- **S4**: audit trail de mudanças (append-only)

---

## Novas funções sugeridas (resumo)

| Nova Função | Objetivo | Benefício | Elementos Críticos | KPIs Impactados | Plano | Prioridade |
|---|---:|---|---|---|---|---:|
| Quick Create Presets | Permitir criação rápida com template (ex.: onboarding básico) | Reduz time-to-publish, aumenta novos cursos | Modal, templates, telemetry | Novos cursos/mês ↑ | Backend: templates API; Frontend: quick-create UI | Alta |
| Progress Encourager | Mostrar micro-tasks e milestones dentro do card | Aumenta completude de cursos | Card progress, modules metadata | Tempo até publicar ↓ | Backend: module states; Frontend: progress UI | Média |
| Review & Approve Queue | Permitir workflow de revisão antes da publicação | Melhora qualidade e compliance | Queue UI, permissions | Qualidade (CSAT) ↑ | Média |

---

## QA / E2E Checklist (sprint-ready)
- [ ] Criar curso `POST /api/v1/courses/` → retorna 201 + S1a emitted
- [ ] Editar curso `PUT /api/v1/courses/<id>/` → atualiza card + S1a
- [ ] Publicar curso `POST /api/v1/courses/<id>/publish/` → S2 emitted, state updated
- [ ] Filtrar / paginar → persistência após refresh
- [ ] Permissões: 403 when unauthorized
- [ ] Image upload & validation errors handled with toasts
- [ ] Performance: abrir modal/detalhe ≤300ms (prefetch/SSR tested)

---

## Plano de rollout (sprint-ready)
1. Sprint 1 — Backend: endpoints CRUD + publish API + audit log (S4)
2. Sprint 2 — Frontend: Create/Edit modals, `CourseCard`, pagination + filters, skeletons
3. Sprint 3 — Telemetry: emit S1a/S2/S4; E2E and UX microtests
4. Sprint 4 — Perf tuning, quick-create presets, release & monitoring

---

## Tickets sugeridos (resumo)
| key | title | labels | assignee |
|---|---|---:|---|
| COURSES-API | ENRICH: Implementar endpoints CRUD para `/api/v1/courses/` | backend,enhancement,high | |
| COURSES-FEAT-MODAL | FEAT: Modal de criação e edição de curso (inclui validações, uploads) | frontend,feature,high | |
| COURSES-PAGINATION | ENH: Paginação + persistência de filtros | frontend,enhancement,medium | |
| COURSES-PUBLISH | FEAT: Publish workflow endpoint `/courses/<id>/publish/` | backend,feature,high | |
| COURSES-AUDIT | FEAT: Audit trail S4 para mudanças em cursos | backend,feature,high | |
| COURSES-UX | UX: microtests com instrutores/admins | ux,research,medium | |

CSV salvo em `docs/planning/03-courses-tickets.csv`.

---

## Recomendações UX e feedback visual
- Skeletons para grid e modal durante fetch
- Toasts para sucesso/erro e confirmação para delete
- `CourseCard` com badge de progresso (%), `students_count`, coorte badges
- CTA `+ Criar novo curso` destacado e rastreável (S1a hook)

---

## Relatório de Progresso (template)
| Data Início | Data Conclusão | Responsável | KPI Observado | Telemetria | Status |
|---|---|---|---|---|---|
| 2026-02-01 | 2026-02-10 | Nome do Eng/PO | Novos cursos/mês | S1a,S2,S4 | Em progresso |

---

*Última atualização: 2026-01-14 — autor: Product/UX Arch*