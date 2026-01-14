# Planejamento — Detalhe do Curso

## Resumo do Módulo (padrão)

| Campo | Descrição |
| --- | --- |
| Módulo | Detalhe do Curso |
| Elementos críticos | Hero (preço, CTA Matricular/Comprar); Lista de módulos e aulas; Breadcrumbs; Cohort selection |
| Lacuna | Falta seleção de coorte antes do CTA; Sem indicadores claros de progresso/prérequisitos; CTA sem rastreabilidade completa (cohort_id) |
| Sugestão | Adicionar dropdown de coorte no hero; exigir `cohort_id` em enroll; mostrar progress e pré-requisitos; emitir S1a no enroll (FE/BE/UX/QA) |
| Responsabilidade | Frontend / Backend / UX / QA / Payments |
| Impacto | Aumento na taxa de conversão de matrícula; redução de desistências no checkout |
| KPI | Taxa de conversão em matrícula; desistência em checkout |
| Prioridade | Alta |
| Telemetria | S1a: `s1a.course.enroll.v1` {user_id, course_id, cohort_id, correlation_id}; S3: payment events; S4: checkout logs |

**Resumo:** Enriquecer o hero com seleção de coorte, badges de progresso, pré-requisitos e rastreabilidade para matrícula/checkout.

> Nota: Todos os eventos emitidos por este módulo devem incluir `correlation_id`. Preencher o campo `Responsabilidade` com nome/alias do owner antes de mover para sprint.

## Elementos críticos
- Hero (preço, CTA Matricular/Comprar)
- Lista de módulos e aulas
- Botão voltar / breadcrumbs

## Diagnóstico
- Falta seleção de coorte antes do CTA
- Sem indicadores de progresso e pré-requisitos
- CTA sem rastreabilidade completa (coorte/story_id)

## Sugestões
- Adicionar dropdown de coorte no hero e badges de status
- Mostrar progresso da turma e pré-requisitos claros
- Registrar evento de matrícula com `cohort_id`, `course_id`, `user_id` (S1a/S3)

## Plano de implementação
1. Backend: endpoint para listar coortes e associar `/courses/<id>/enroll/` com `cohort_id` obrigatório (quando aplicável)
2. Frontend: atualizar hero com seleção de coorte, spinner de processamento e mensagens de status
3. UX: testes de fluxo de matrícula e mensagens de falha (pagamento)
4. QA: validar retry de pagamento e UX do estado "Processando..." para evitar cliques repetidos

### Critérios de validação
- Seleção de coorte disponível antes do checkout
- Evento S1a enviado com `cohort_id` e `course_id` no click da matrícula
- Fluxo de pagamento interrompido exibe erro contextual e sugere retry

## Impacto no KPI
- Aumento na taxa de conversão de matrícula
- Redução em desistências na etapa de checkout

## Prioridade
- Alta

## Telemetria
- S1a (matrícula), S3 (pagamentos), S4 (logs de checkout)

---

## Tickets sugeridos
- [ ] FEAT: endpoint `/courses/<id>/cohorts/` e obrigatoriedade de `cohort_id` no enroll
- [ ] FEAT: atualizar hero com dropdown de coorte e mensagens de status