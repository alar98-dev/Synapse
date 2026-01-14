# Documentação - Synapse

Bem-vindo à documentação do projeto Synapse. Esta pasta contém a documentação de telas, contratos de API iniciais, plano técnico e status de implementação.

## 📖 Documentos Principais

- **`missing_implementation.md`** — Status atual de implementação, o que está feito vs. faltante, roadmap de prioridades.
- **`plan.md`** — Plano técnico e pedagógico original (PT-BR), com roadmap de milestones e requisitos.
- **`screens.md`** — Especificação de 30 telas principais, priorizadas por fluxo de usuário.
- **`implementation_plan.md`** — Plano de implementação com tarefas por área (infraestrutura, backend, frontend, IA).
- **`architecture.md`** — Diagrama e fluxo de alto nível da arquitetura Synapse.
- **`cae-prompts.md`** — Estratégia e templates de prompts para a CAE.
- **`cae-api.md`** — Contratos de API do Cognitive Assessment Engine.
- **`deploy.md`** — Guia de deploy Docker + checklist operacional.

## 🎯 Como Começar

1. **Entender o status:** Abra `missing_implementation.md` para ver o que está feito e o que falta.
2. **Consultar o plano:** Veja `plan.md` para o contexto completo (visão, arquitetura, roadmap).
3. **Explorar telas:** Use `screens.md` para entender os fluxos de usuário e componentes UI.
4. **Detalhes de implementação:** Veja `implementation_plan.md` para tarefas específicas por área.

## 📋 Sumário Executivo

| Área | Status | % |
|------|--------|-----|
| Backend (Apps + API) | 🟡 Parcial | 70% |
| Autenticação | 🟢 Completo | 100% |
| Execução de Código | 🟡 Parcial | 80% |
| Submissões | 🟡 Parcial | 75% |
| Cursos & Cohorts | 🟡 Parcial | 60% |
| Frontend | 🔴 Não iniciado | 0% |
| Payments | 🔴 Não iniciado | 0% |
| IA Agent | 🔴 Não iniciado | 0% |
| Observabilidade | 🔴 Não iniciado | 0% |
| Kubernetes & IaC | 🔴 Não iniciado | 0% |

Veja `missing_implementation.md` para lista completa e detalhes.

## 🚀 Próximos Passos (Recomendado)

1. **MVP Hardening** (Semanas 1-2)
   - Remover docker.sock dependency
   - Testes unitários (~70% cobertura)
   - Frontend mínimo (React/Next.js)

2. **Conteúdo & Cohorts** (Semanas 3-4)
   - Criar 3-5 cursos iniciais
   - Completar enrollment em Cohort

3. **Observabilidade** (Semanas 5-6)
   - Prometheus + Grafana
   - Logging estruturado

4. **Produção** (Semanas 7+)
   - Kubernetes manifests
   - Terraform IaC
   - Payments (Stripe + PIX)
   - IA Agent (RAG + LLM)

## 📚 Referências

- `../README.md` — Quick start e setup
- `../plan.md` — Original tech plan (simlink para `docs/plan.md`)
- `../docker-compose.yml` — Development stack
- `../.github/workflows/ci.yml` — CI pipeline
