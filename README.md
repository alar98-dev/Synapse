# Synapse - AI Training Platform

Plataforma de ensino prático e síncrono com suporte a cohorts, ambientes de código integrados (sandbox) e avaliação automatizada de projetos.

## 📋 Status Atual (MVP)

- ✅ **Backend:** Django + DRF com apps `users`, `courses`, `sandbox`, `submissions`
- ✅ **Autenticação:** JWT via `djangorestframework-simplejwt`
- ✅ **Execução:** Docker-based code execution com Celery + Redis
- ✅ **API Docs:** OpenAPI/Swagger via `drf-spectacular`
- ✅ **CI:** GitHub Actions pipeline básico
- 🔨 **Próximas:** Frontend, Payments, IA Agent, Kubernetes

Veja `docs/missing_implementation.md` para detalhes completos do que falta implementar.

## 🚀 Quick Start (Development)

### Pré-requisitos
- Docker & Docker Compose
- Python 3.11+ (local dev, opcional)

### Passos

```bash
# 1. Clone e entre no diretório
git clone https://github.com/alar98-dev/Synapse.git
cd Synapse

# 2. Prepare environment
cp .env.example .env
# Opcional: configure os hooks do filamento
export FILAMENT_WEBHOOK_URL=https://hooks.internal/filament
# LLM callbacks agora passam pelo workflow n8n que recebe os mesmos payloads

## 🎯 Filament Hooks: estrutura e fluxo

- **Webhook**
  - Endpoint recebe POST com `FilamentAuditEntry.to_dict()` (vetor, módulo, story, estado, decisão, razão, timestamp, contexto de payload/dimensões).
  - Pode ser usado para alimentar dashboards de auditoria, gatilhos de alertas ou replicar logs em outro sistema.
  - Exemplo de payload:

```json
{
  "vector_name": "CourseEnrollment",
  "module": "courses.CourseViewSet.enroll",
  "story_id": "BACKLOG-1234",
  "state": "S2",
  "decision": "ACEITAR",
  "reason": "Evento validado pelo filamento",
  "timestamp": "2026-01-14T11:37:22.123456",
  "context_snapshot": {
    "dimensions": {
      "identidade": {"user_id": 7, "role": "student"},
      "contexto": {"course_id": 5, "cohort_id": 3},
      "dependencia": {"duplicate": false},
      "risco": {"capacity": 12, "current": 5, "score": 0.5}
    },
    "payload": {"course_id": 5, "requested_cohort": 3, "caller": "user@example.org"}
  }
}
```

- **LLM orchestration via n8n**
  - O webhook envia os mesmos `FilamentAuditEntry` que podem acionar nós HTTP dentro do workflow para disparar chamadas a LLMs, enriquecer prompts ou alimentar agentes.
  - Configure os nós em n8n para chamar a API LLM desejada, registrar a resposta e fechar o ciclo de aprendizado, mantendo toda interação auditada.

## 🧠 Fluxo esperado do Filamento

1. `CourseViewSet.enroll` cria o `EventVector` e avança por S1a/S1b antes de chamar `FilamentDecisionService.process`.  
2. `FilamentDecisionService` avalia identidade/contexto/risco e dispara `default_filament_hooks` com o `FilamentAuditEntry`.  
3. Hooks enviam POSTs para as URLs configuradas e registram logs locais ao faltar as variáveis.  
4. Após persistência (`S3`), o serviço registra um novo entry e, em seguida, um `record_learning` para S4 para manter o aprendizado visível.  
5. O workflow n8n responsável por `S4` pode observar o mesmo payload ou uma versão enriquecida para alimentar dashboards ou acionar LLMs internos e outros agentes.

# 3. Build e start services
docker-compose build
docker-compose up -d

# 4. Run migrations e create superuser
docker-compose exec web python manage.py migrate
docker-compose exec web python manage.py createsuperuser

# 5. Acesse
# - API: http://localhost:8000/api/v1/
# - Swagger: http://localhost:8000/api/v1/docs/
# - Admin: http://localhost:8000/admin/
# - Worker logs: docker-compose logs -f worker
```

### Testar Fluxo de Execução

```bash
# 1. Obter token JWT
curl -X POST http://localhost:8000/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"yourpassword"}'

# 2. Submeter código
curl -X POST http://localhost:8000/api/v1/sandbox/execute/ \
  -H "Authorization: Bearer <seu_token>" \
  -H "Content-Type: application/json" \
  -d '{"code":"print(1+1)","language":"python"}'

# 3. Monitorar job em /api/v1/sandbox/<job_id>/
```

## 📁 Estrutura

```
synapse/
├── synapse_project/     # Django project settings
├── core/                # Healthcheck & core utilities
├── users/               # Custom User, JWT auth
├── courses/             # Courses, Cohorts (MVP)
├── sandbox/             # Code execution engine (Celery + Docker)
├── submissions/         # Problem, Submission models
├── docker-compose.yml   # Dev stack: PostgreSQL, Redis, Celery worker
├── Dockerfile
├── docker-entrypoint.sh
├── requirements.txt
├── docs/                # Documentation
│   ├── plan.md          # Technical & pedagogical plan
│   ├── screens.md       # 30 main UI screens
│   ├── missing_implementation.md  # Current gaps & roadmap
│   └── index.md
└── .github/workflows/   # CI/CD (GitHub Actions)
```

## 🔑 Key Endpoints

### Users & Auth
- `POST /api/v1/auth/register/` — Register new user
- `POST /api/v1/auth/token/` — Get JWT token
- `POST /api/v1/auth/token/refresh/` — Refresh token
- `GET /api/v1/auth/me/` — Current user profile

### Courses & Cohorts
- `GET/POST /api/v1/courses/` — List/create courses
- `GET/POST /api/v1/courses/cohorts/` — List/create cohorts

### Code Execution (Sandbox)
- `POST /api/v1/sandbox/execute/` — Submit code execution job
- `GET /api/v1/sandbox/<id>/` — Get job status & output
- `POST /api/v1/sandbox/<id>/cancel/` — Cancel running job

### Submissions
- `GET/POST /api/v1/submissions/submissions/` — List/create submissions
- `GET/POST /api/v1/submissions/problems/` — List/create problems (admin)

### Billing (Payments)
- `GET /api/v1/payments/subscriptions/` — Get current subscription and plan limits
- `POST /api/v1/payments/subscriptions/upgrade` — Start upgrade (returns checkout_id or redirect)
- `POST /api/v1/payments/subscriptions/cancel` — Cancel subscription (supports cancel_at_period_end)
- `GET /api/v1/payments/receipts/` — List receipts
- `GET /api/v1/payments/receipts/:id/download` — Download receipt (PDF/CSV)

Quick example (get subscription):

```bash
curl -X GET "http://localhost:8000/api/v1/payments/subscriptions/" \
  -H "Authorization: Bearer <JWT>" \
  -H "Accept: application/json"
```

See `docs/planning/08-billing.md` for payload examples, test snippets and implementation notes.

## 🛠️ Development

### Run tests
```bash
docker-compose exec web python manage.py test
# ou com pytest
docker-compose exec web pytest
```

### Make migrations
```bash
docker-compose exec web python manage.py makemigrations
docker-compose exec web python manage.py migrate
```

### Access Django shell
```bash
docker-compose exec web python manage.py shell
```

### View logs
```bash
docker-compose logs -f web       # Django app
docker-compose logs -f worker    # Celery worker
docker-compose logs -f db        # PostgreSQL
docker-compose logs -f redis     # Redis
```

## ⚠️ Known Issues & Tech Debt

1. **Worker uses `/var/run/docker.sock`** — security risk, use isolated executor in production
2. **No resource limits** on containers — add CPU/memory limits
3. **Python only** — add support for JS, Go, Rust
4. **No cleanup mechanism** — orphaned containers possible
5. **No autoscaling** — manual Celery worker scaling

Veja `docs/missing_implementation.md` para roadmap completo.

## 📚 Documentation

- `docs/plan.md` — Technical & pedagogical plan (PT-BR)
- `docs/screens.md` — 30 UI screens specification (PT-BR)
- `docs/implementation_plan.md` — Implementation strategy (PT-BR)
- `docs/missing_implementation.md` — Current gaps & priorities (PT-BR)

- `docs/frontend_islands_architecture.md` — Frontend: HTML/JS + React Islands (Progressive Enhancement)

## 🔗 Links

- Repository: https://github.com/alar98-dev/Synapse
- Plan: `docs/plan.md` (PT-BR)
- Issues: GitHub Issues

## 📝 License

(To be defined)
