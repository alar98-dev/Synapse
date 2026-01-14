# Status de Implementação - Synapse MVP

**Data:** Dezembro 9, 2025  
**Objetivo:** Rastrear o progresso do projeto contra o plano técnico original (`docs/plan.md`).

---

## 📊 Resumo Executivo

| Categoria | Status | % Completo |
|-----------|--------|-----------|
| **MVP Core (Apps + API)** | 🟡 Parcial | ~70% |
| **Autenticação & Autorização** | 🟢 Completo | 100% |
| **Execução de Código** | 🟡 Parcial | ~80% |
| **Submissões & Avaliação** | 🟡 Parcial | ~75% |
| **Cursos & Cohorts** | 🟡 Parcial | ~60% |
| **Frontend & UI** | 🔴 Não iniciado | 0% |
| **Payments** | 🔴 Não iniciado | 0% |
| **IA Agent Tutor** | 🔴 Não iniciado | 0% |
| **Observabilidade & Metrics** | 🔴 Não iniciado | 0% |
| **Kubernetes & IaC** | 🔴 Não iniciado | 0% |
| **Testes E2E** | 🟡 Parcial | ~10% |

---

## ✅ Completado

### Backend - Apps Django
- ✅ `core` — healthcheck endpoint
- ✅ `users` — custom User model com `role` field, JWT auth (simplejwt), endpoints `/token`, `/token/refresh`, `/me`
- ✅ `courses` — models `Course`, `Cohort`; viewsets com permissões `IsStaffOrReadOnly` (atualizado para incluir `role == 'teacher'`)
- ✅ `sandbox` — model `ExecutionJob` com container tracking; Celery task `execute_code_task`; endpoints submit/cancel/detail
- ✅ `submissions` — models `Problem`, `Submission` com status completos (including `STATUS_CANCELED`); viewset com auto-enqueue
- ✅ `admin` — Django admin configurado para todos os apps

### Infraestrutura
- ✅ `docker-compose.yml` — services `db` (PostgreSQL), `redis`, `web` (Django), `worker` (Celery)
- ✅ `Dockerfile` — build com Python 3.11, dependencies, entrypoint
- ✅ `docker-entrypoint.sh` — migrate, collectstatic, opcional createsuperuser
- ✅ `.env.example` — variáveis de configuração

### API & Docs
- ✅ OpenAPI schema — drf-spectacular integrado, `/api/v1/schema/`, `/api/v1/docs/`
- ✅ REST endpoints — CRUD de courses, cohorts, submissions, sandbox execution

### Execução de Código
- ✅ Docker SDK integration — worker cria containers efêmeros via SDK
- ✅ Timeouts — Celery `soft_time_limit` e `time_limit` implementados; SoftTimeLimitExceeded tratado
- ✅ Cancellation — endpoint `/api/v1/sandbox/<id>/cancel/` marca job como `canceled` e remove container
- ✅ Submission auto-update — worker atualiza `Submission` status automaticamente ao terminar job

### CI/CD (Minimal)
- ✅ `.github/workflows/ci.yml` — pipeline básico com `migrate` + `test` (pytest)

---

## 🟡 Parcialmente Completado

### Backend - Modelos & API
- 🟡 `Course` e `Cohort` — básico implementado, faltam:
  - [ ] Relação many-to-many entre `Cohort` e `User` (enrollment)
  - [ ] Endpoints para get members de uma cohort
  - [ ] Filtros/buscas de cursos (por tag, nível, preço)
  - [ ] Lógica de controle de inscrição (capacity, enrollment_open)

- 🟡 `Submission` — status e job tracking ok, faltam:
  - [ ] `result_summary` ser populado automaticamente pelo worker (parse de stdout/stderr)
  - [ ] Indicadores de score/pontos baseados em testes
  - [ ] Histórico de submissões por aluno

### Execução de Código
- 🟡 Sandbox — execução básica ok, faltam:
  - [ ] Hardening: remover dependência de `/var/run/docker.sock` na worker; implementar isolamento (runner pod em k8s ou executor remoto)
  - [ ] Suporte a linguagens além de Python (JS, Go, Rust) — atualmente hardcoded `python:3.11-slim`
  - [ ] Presets de bibliotecas por linguagem/contexto (ex.: ML preset com numpy, pandas, sklearn)
  - [ ] Limite de memória e CPU no container (atualmente sem limits)
  - [ ] Captura melhorada de erros/stacktraces formatados

### Frontend
- 🟡 Existem esboços de endpoints e schemas para API, mas:
  - [ ] Interface web/móvel não foi implementada (React/Next.js)
  - [ ] Editor de código integrado (Monaco/Mintlify) não existe
  - [ ] Dashboard do aluno não existe
  - [ ] Player de vídeo/replay não existe

---

## 🔴 Não Iniciado (Crítico para Produção)

### Conteúdo de Cursos
- [ ] 10 cursos iniciais (gratuitos) — nenhum foi criado
  - Bloco 1: Introdução à IA, Python para DS, Matemática para ML, SQL
  - Bloco 2: Engenharia de Prompt, Git/GitHub, Visualização de Dados
  - Bloco 3: Machine Learning Básico, Redes Neurais, Ética em IA
- [ ] Problemas/exercícios de exemplo para cada curso
- [ ] Seeds/fixtures com dados de teste

### Payments
- [ ] App `payments` — nenhuma implementação
- [ ] Integração com stripe/pix para cobranças
- [ ] Modelos de transação, invoice, reembolso
- [ ] Endpoints para carrinho, checkout, webhook de pagamento

### IA Agent Tutor
- [ ] App `ai_agent` — nenhuma implementação
- [ ] Vector DB (Pinecone/Milvus) — não configurado
- [ ] Pipeline RAG para transcrições
- [ ] Integração com LLM (OpenAI/Anthropic/Hugging Face)
- [ ] Context persistente por aluno
- [ ] Notificações proativas

### Observabilidade
- [ ] Prometheus metrics — nenhuma coleta implementada
- [ ] Grafana dashboards
- [ ] ELK/Opensearch para logs centralizados
- [ ] OpenTelemetry tracing
- [ ] Alertas e health checks estruturados

### Infraestrutura & DevOps
- [ ] Kubernetes manifests (deployments, services, configmaps, secrets)
- [ ] Terraform / IaC para provisioning de cloud infra (AWS/GCP/Azure)
- [ ] Hardened runner para sandbox (isolamento de processo/gVisor/AppArmor)
- [ ] Container registry setup (ECR/GCR/ACR)
- [ ] S3/MinIO para replays e assets
- [ ] HashiCorp Vault ou Cloud Secrets Manager

### Testes
- [ ] Testes unitários completos para apps (especialmente `submissions`, `sandbox`, `users`)
- [ ] Testes de integração para fluxo submit→execute→feedback
- [ ] Testes E2E (Cypress/Playwright) para frontend
- [ ] Testes de carga para execução paralela de jobs
- [ ] Testes de segurança (OWASP, container security)

### Documentação Técnica
- [ ] API docs completa (com exemplos de curl/postman)
- [ ] Architecture Decision Records (ADRs)
- [ ] Setup guide detalhado (dev, staging, prod)
- [ ] Troubleshooting & debugging guide

### Gamificação & Engagement
- [ ] Sistema de XP e níveis
- [ ] Streaks
- [ ] Certificados verificáveis
- [ ] Badges/achievements

### Comunidade
- [ ] Fórum interno ou integração Discord/Slack
- [ ] Sistema de threads por turma
- [ ] Notificações em tempo real (WebSockets)

### Analytics & Relatórios
- [ ] Dashboard de saúde da plataforma (admin)
- [ ] Relatórios financeiros (revenue, refunds, affiliates)
- [ ] Relatórios de uso (usuários ativos, engajamento, conversão)

---

## 🎯 Próximas Prioridades (Ordem Recomendada)

### Fase 1: MVP Hardening (Semanas 1-2)
1. **Remover docker.sock dependency** → implementar executor isolado
   - Criar app `executor` com runner em container separado ou k8s Job
   - Usar comunicação via RPC/gRPC ou fila dedicada
   
2. **Testes unitários** para `submissions`, `sandbox`, `users`
   - Cobertura mínima 70%
   - Fixtures com dados de teste

3. **Frontend mínimo** (React SPA ou Next.js)
   - Telas: Login, Dashboard do aluno, Sandbox editor, Submissão
   - Integração com endpoints existentes

### Fase 2: Conteúdo & Cohorts (Semanas 3-4)
4. **Criar 3-5 cursos gratuitos iniciais**
   - Escrever conteúdo e problemas
   - Populate `Course`, `Problem`, `Cohort` via fixtures

5. **Completar modelo de Cohort**
   - Enrollment (M2M com User)
   - Controle de inscrição (capacity, dates)
   - Endpoints de gerenciamento

### Fase 3: Observabilidade (Semanas 5-6)
6. **Prometheus + Grafana**
   - Metrics básicas: job duration, success rate, resource usage
   - Dashboard de health da plataforma

7. **Logging estruturado**
   - Python logging config
   - Structured logs em JSON

### Fase 4: Produção (Semanas 7+)
8. **Kubernetes manifests** para deploy
9. **Terraform** para infra as code
10. **Payments** (Stripe + PIX)
11. **IA Agent** (RAG + LLM integration)

---

## 📋 Dependências & Bloqueadores

| Item | Bloqueador? | Depende De |
|------|-------------|-----------|
| Frontend | Sim | API REST (✅ pronto) |
| Payments | Não | Nenhum (independente) |
| IA Agent | Não | Vector DB setup, LLM key |
| Kubernetes | Sim | Executor hardening |
| Testes E2E | Sim | Frontend + API |
| Produção | Sim | Kubernetes + observabilidade + testes |

---

## 🐛 Problemas Conhecidos & Técnicos Debt

1. **Docker socket em worker** — security risk, usar isolamento em produção
2. **Sem limites de recursos em container** — CPU/memory unbounded
3. **Linguagem hardcoded** — apenas Python suportado
4. **Sem retry logic robusto** — falhas em Docker SDK podem não ser recuperáveis
5. **Sem mecanismo de cleanup** — containers órfãos possíveis se worker falhar
6. **Sem autoscaling** — Celery workers não escaláveis automaticamente
7. **Sem persistência de replays** — vídeo/transcrições não armazenadas

---

## 📊 Métricas de Progresso

- **Total de milestones:** 4 (MVP → Cohorts → Agent → Escala)
- **Milestone 1 (MVP) progresso:** ~70% (faltam testes, frontend, executor hardening)
- **Estimativa para "pronto para produção":** 8-12 semanas (com team de 2-3 devs)

---

## 🔗 Referências

- `docs/plan.md` — plano técnico original
- `docs/screens.md` — especificação de telas (30 principais)
- `docs/implementation_plan.md` — plano de implementação inicial
- `.github/workflows/ci.yml` — CI pipeline
- `docker-compose.yml` — dev stack

