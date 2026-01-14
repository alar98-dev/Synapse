# Test Flows — Synapse

Este documento descreve os fluxos cobertos pelos testes automáticos atuais, mostrando para cada teste: objetivo, endpoint/método, entrada esperada, saída esperada e efeitos colaterais (DB / fila).

---

## 1) `sandbox/tests/test_views.py`

- Teste: `test_submit_creates_job_and_enqueues`
  - Objetivo: validar que uma submissão de código cria um `ExecutionJob` e enfileira a task Celery.
  - Endpoint: `POST /api/v1/sandbox/submit/` (view `SubmitCodeView`)
  - Autenticação: Bearer / sessão (usuário autenticado)
  - Entrada (JSON): `{ "code": "print(2+2)", "language": "python" }`
  - Comportamento esperado:
    - HTTP 201 Created
    - Cria `ExecutionJob` com `user`, `code`, `language`
    - Chama `execute_code_task.apply_async((job.id,), soft_time_limit=..., time_limit=...)`
  - Efeitos colaterais: DB: `ExecutionJob` salvo; Celery: task enfileirada (mock verificado).

- Teste: `test_job_detail_requires_auth`
  - Objetivo: garantir que endpoint de detalhe exige permissão (usuário não autenticado recebe 403).
  - Endpoint: `GET /api/v1/sandbox/jobs/<id>/` (view `JobDetailView`)
  - Autenticação: não autenticado → espera 403
  - Entrada: nenhum body; apenas GET para o recurso
  - Saída esperada: HTTP 403 (permission denied)

- Teste: `test_cancel_no_container_returns_400`
  - Objetivo: ao cancelar job sem `container_id`, retornar 400.
  - Endpoint: `POST /api/v1/sandbox/jobs/<id>/cancel/` (view `CancelJobView`)
  - Autenticação: usuário autenticado
  - Pré-condição: `ExecutionJob` criado mas `container_id` é `None`
  - Saída esperada: HTTP 400 com `{'detail': 'No running container for this job'}`

---

## 2) `submissions/tests/test_views.py`

- Teste: `test_create_submission_creates_job_and_submission`
  - Objetivo: criar uma `Submission` liga-a a um `ExecutionJob` e enfileirar execução.
  - Endpoint: `POST /api/v1/submissions/submissions/` (viewset `SubmissionViewSet` - create)
  - Autenticação: usuário autenticado
  - Entrada (JSON): `{ "problem": <problem_id>, "code": "def add(a,b): return a+b" }`
  - Comportamento esperado:
    - HTTP 201 Created
    - Cria `Submission` com `user`, `problem`, `code`
    - Cria `ExecutionJob` associado e associa em `submission.job`
    - Enfileira `execute_code_task.apply_async(...)` (mock verificado)

- Teste: `test_refresh_status_syncs_submission`
  - Objetivo: sincronizar status da `Submission` com o `ExecutionJob` existente via endpoint `refresh_status`.
  - Endpoint: `GET /api/v1/submissions/submissions/<id>/refresh_status/`
  - Pré-condição: `ExecutionJob` já com `stdout`, `status = STATUS_SUCCESS`
  - Saída esperada: HTTP 200
  - Efeito: `Submission.status` atualizado para `STATUS_SUCCESS` e `result_summary` contém saída (`stdout`).

---

## 3) `users/tests/test_views.py`

- Teste: `test_me_endpoint_returns_user`
  - Objetivo: endpoint `/api/v1/users/me/` retorna dados do usuário autenticado.
  - Endpoint: `GET /api/v1/users/me/` (nome `auth-me`)
  - Autenticação: usuário autenticado
  - Entrada: nenhuma
  - Saída esperada: HTTP 200 e JSON contendo pelo menos `username` igual ao usuário autenticado

---

## 4) `tests/test_llm_connector.py` — LLM client & circuit breaker

Os testes aqui cobrem a lógica de `cognition.llm_connector` (classe `LLMClient`, `CircuitBreakerState`, validações e telemetria). Não dependem de rede: usam conectores fake.

Principais fluxos/testes (resumo):

- `test_mock_provider`
  - Objetivo: `LLMClient(provider='mock')` retorna payload com `text`.
  - Entrada: `client.execute('context','prompt')`
  - Saída esperada: dict com chave `text`.

- `test_invalid_response_triggers_error`
  - Objetivo: resposta inválida (`text` vazio) lança `LLMError`.

- `test_circuit_breaker_opens`
  - Objetivo: quando connector sempre falha com erro retryable, circuit breaker transita para `open`.

- `test_retry_until_success_records_failures`
  - Objetivo: connector falha duas vezes (retryable) e na terceira retorna sucesso; validar contadores, telemetria e que `execute` finalmente retorna resposta.
  - Entrada: `client.execute(..., session_id='session-retry-success')` com `FlakyConnector` implementado nos testes
  - Saída esperada: resposta válida; telemetria registra `turn_failed` eventos e `turn_success` ao final; connector.calls == 3.

- `test_retry_exhausted_opens_circuit`
  - Objetivo: quando excede tentativas, circuit abre; chamadas subsequentes são bloqueadas com `code == 'circuit_open'`; telemetria registra `fallback_used` e eventos relacionados.

- `test_retry_fail_fast_on_non_retryable_error`
  - Objetivo: se LLM retorna payload considerado inválido e não-retryable, não faz retries e registra `invalid_llm_response` + `fallback_used`.

- `test_response_validation_*` (vários)
  - Objetivo: validar regras de aceitação da resposta (texto não vazio, não degenerado, raw válido, tamanho mínimo).
  - Entrada: `client.execute(..., stage='response_validation')` com conectores que retornam vários payloads.
  - Saída esperada: `LLMError` para casos inválidos; quando válido, retorna `{'text':..., 'raw':...}` e telemetria com `turn_success`.

- `test_breaker_*` e `test_telemetry_contract`
  - Objetivo: verificar transições `OPEN`, `HALF_OPEN`, `CLOSED`, eventos de telemetria e contrato (cada evento contem `session_id`, `provider`, `attempt`, `stage`, `timestamp`).

Efeitos colaterais: manipulação interna do `client.circuit_breaker` (estado em memória) e emissão de eventos para o `telemetry` passado nos testes (capturado por `CapturingTelemetry`).

---

## Observações gerais

- Autenticação: testes de API usam `rest_framework.test.APIClient` com `force_authenticate` para evitar fluxos de login.
- Execução de código: a task `execute_code_task` é mockada nos testes que verificam enfileiramento; a execução real (Docker/local) não é executada nesses testes.
- Banco de dados nos testes: durante a execução local de testes, usamos SQLite em memória via `conftest.py` para isolar dos serviços de produção.

---

## Próximas ações possíveis

- Gerar diagrama mermaid do fluxo `submit -> job -> worker -> submission`.
- Extrair automaticamente inputs/outputs dos testes e gerar fixtures JSON por fluxo.

Escolha uma ação que quer que eu faça a seguir.
