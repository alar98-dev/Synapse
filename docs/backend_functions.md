# Backend - Supported Functions

**Data:** 2025-12-09

Este documento lista as funções, endpoints e tarefas que o backend do projeto Synapse já suporta (MVP atual). Inclui observações sobre permissões e comportamento.

---

## Sumário por área

- Core
- Users / Auth
- Courses & Cohorts
- Sandbox (Execução de Código)
- Submissions (Problems & Submissions)
- Background Tasks / Worker
- Admin / Dev utilities

---

## Core

- `GET /api/v1/` (core health)
  - Função: checar saúde do serviço
  - Permissão: pública
  - Retorno: `{"status": "ok"}`

---

## Users / Auth

- `POST /api/v1/auth/register/`
  - Função: registrar novo usuário
  - Permissão: pública
  - Entrada: campos do `RegisterSerializer` (username, password, email, etc.)
  - Saída: dados do usuário criado

- `POST /api/v1/auth/token/`
  - Função: gerar par de tokens JWT (access + refresh)
  - Permissão: pública
  - Entrada: `{ "username": "...", "password": "..." }`
  - Saída: `{ "access": "..", "refresh": ".." }`

- `POST /api/v1/auth/token/refresh/`
  - Função: renovar token access
  - Permissão: pública (precisa do `refresh`)

- `GET /api/v1/auth/me/`
  - Função: retornar dados do usuário autenticado
  - Permissão: autenticado (JWT)

Observações:
- Modelo `User` customizado com campo `role` (ex.: `student`, `teacher`, `staff`).

---

## Courses & Cohorts

- `GET/POST /api/v1/courses/`
  - Função: listar e criar cursos
  - Permissão: listar público/autenticado (dependendo do viewset), criar restrito a staff/teachers

- `GET/PUT/DELETE /api/v1/courses/{id}/`
  - Função: recuperar/atualizar/remover curso
  - Permissão: atualizar/deletar restrito a staff/teachers

- `GET/POST /api/v1/cohorts/`
  - Função: listar e criar cohorts (turmas)
  - Permissão: criar restrito a staff/teachers

- `GET/PUT/DELETE /api/v1/cohorts/{id}/`
  - Função: recuperar/atualizar/remover cohort
  - Permissão: atualizar/deletar restrito a staff/teachers

Observações:
- `Course` e `Cohort` possuem campos como `title`, `description`, `start_date`, `end_date`, `capacity`, `enrollment_open`.
- Ainda falta implementar enrollment M2M entre `User` e `Cohort`.

---

## Sandbox (Execução de Código)

- `POST /api/v1/sandbox/submit/`
  - Função: submeter código para execução imediata
  - Permissão: autenticado
  - Entrada: `{ "code": "...", "language": "python" }`
  - Saída: dados do `ExecutionJob` criado (id, status pending, created_at, timeout_seconds)
  - Comportamento: cria `ExecutionJob`, enfileira `execute_code_task` no Celery com `soft_time_limit` = `timeout_seconds` e `time_limit` = soft+5

- `GET /api/v1/sandbox/jobs/{id}/`
  - Função: recuperar status e resultados do job
  - Permissão: autenticado
  - Saída: campos do `ExecutionJob` (stdout, stderr, exit_code, status, started_at, finished_at, duration)

- `POST /api/v1/sandbox/jobs/{id}/cancel/`
  - Função: cancelar job em execução
  - Permissão: autenticado
  - Comportamento: tenta `kill` do container associado (`container_id`), marca `ExecutionJob` como `canceled`, atualiza `Submission` vinculada (se existir)

Observações:
- `ExecutionJob` campos principais: `user`, `code`, `language`, `status`, `stdout`, `stderr`, `exit_code`, `duration`, `container_id`, `timeout_seconds`, timestamps.
- O fluxo atual usa Docker SDK para criar/gerenciar containers; o worker tem acesso ao Docker daemon (via `/var/run/docker.sock`) — abordagem de POC, não segura para produção.

---

## Submissions (Problems & Submissions)

- `GET/POST /api/v1/problems/`
  - Função: listar e criar `Problem` (exercícios)
  - Permissão: admin apenas
  - `Problem` inclui `test_template` que deve conter `{student_code}` token para injeção do código do aluno

- `GET/PUT/DELETE /api/v1/problems/{id}/`
  - Função: CRUD para problemas (admin)

- `GET/POST /api/v1/submissions/`
  - Função: listar e criar `Submission`
  - Permissão: autenticado para criar
  - Comportamento ao criar: monta o código combinado (`problem.test_template.replace('{student_code}', student_code)`), cria `ExecutionJob` com o codigo combinado, enfileira `execute_code_task`, cria `Submission` com `status=pending` e referencia para `job`

- `GET /api/v1/submissions/{id}/`
  - Função: obter detalhes da submissão (código, status, result_summary)

- `GET /api/v1/submissions/{id}/refresh_status/`
  - Função: ação custom que sincroniza o `Submission` com o `ExecutionJob` (pega stdout/stderr e status)
  - Permissão: autenticado

Observações:
- `Submission` campos: `user`, `problem`, `job`, `code`, `status`, `result_summary`.
- Worker atualiza automaticamente `Submission` vinculado ao `ExecutionJob` ao concluir a execução (mapeamento de status realizado no task).

---

## Background Tasks / Worker

- `execute_code_task(job_id)` (Celery `@shared_task`)
  - Função: executar o código do `ExecutionJob` em um container criado via Docker SDK
  - Passos:
    - Marca job como `running`, grava `started_at`
    - Cria container com `python:3.11-slim`, comando que injeta o `code` via heredoc
    - Configura `mem_limit='256m'` (exemplo), `network_disabled=True`, `detach=True`
    - Inicia container, espera término (`container.wait()`), captura `logs()` para `stdout`/`stderr` e `exit_code`
    - Em caso de `SoftTimeLimitExceeded` (Celery), tenta `kill()` do container e marca `canceled`
    - Remove container no `finally`
    - Marca `finished_at`, calcula `duration` e salva
    - Tenta atualizar `Submission` vinculado com `result_summary`

Observações:
- Timeouts: `execute_code_task` é enfileirado com `soft_time_limit` = `ExecutionJob.timeout_seconds` e `time_limit` = soft + 5
- Erros de API Docker são capturados e marcados como `failed` no `ExecutionJob`.

---

## Admin / Dev utilities

- Django admin expõe modelos: `User`, `Course`, `Cohort`, `Problem`, `Submission`, `ExecutionJob` para gerenciamento manual
- GitHub Actions CI: pipeline básico `migrate` + `test`

---

## Permissões e Roles

- `permissions.IsAuthenticated` protege endpoints que dependem do usuário
- `permissions.IsAdminUser` protege endpoints de criação/edição de `Problem`
- `IsStaffOrReadOnly` custom permission usada em `courses` para permitir criação por `staff` ou `teacher` role

---

## Limitações Atuais (importante notar)

- Executor usa Docker daemon local (via socket) — bloquear/isolamento necessário para produção
- Suporta apenas `python` como linguagem executável por enquanto
- Containers tem limites básicos (`mem_limit='256m'`) mas falta controle de CPU e quotas mais refinadas
- Mecanismo de cleanup e retries pode deixar containers órfãos se worker morrer

---

## Exemplos rápidos (curl)

- Submeter código (sandbox)

```bash
curl -X POST http://localhost:8000/api/v1/sandbox/submit/ \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"code":"print(2+2)", "language":"python"}'
```

- Obter status de um job

```bash
curl -X GET http://localhost:8000/api/v1/sandbox/jobs/123/ \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

- Criar submissão para um problema (assumindo `problem=1`)

```bash
curl -X POST http://localhost:8000/api/v1/submissions/ \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"problem": 1, "code": "def add(a,b):\n    return a+b"}'
```

---

## Onde olhar no código

- `synapse_project/urls.py` — rotas principais
- `users/` — autenticação e registro
- `courses/` — `Course` e `Cohort` viewsets
- `sandbox/` — `ExecutionJob` model, views (`SubmitCodeView`, `JobDetailView`, `CancelJobView`) e `tasks.execute_code_task`
- `submissions/` — `Problem` e `Submission` models e `SubmissionViewSet`

---

Se quiser, eu posso:
- Gerar um checklist mais granular por endpoint (métodos, payloads, códigos de resposta)
- Exportar uma OpenAPI parcial com exemplos curl
- Implementar testes unitários para endpoints críticos (submit → execute → update)

Qual desses você prefere a seguir?
