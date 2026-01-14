# Documentação Detalhada da API Synapse (Cognitive Assessment Engine)

> Visão geral, rotas, modelos e capacidades por sessão — gerado para orientar o time de frontend antes da implementação UI.

## Sumário

- Visão geral
- Autenticação
- Endpoints Principais
  - Auth (registro, token, me)
  - Courses
  - Sandbox (execução de código)
  - Submissions
  - Cognition (Assessment Sessions)
- Modelos e campos (com exemplos)
  - AssessmentSession
  - EvaluationTurn
  - CognitiveProfile
  - CognitiveReport
- Fluxos e capacidades por sessão (use cases)
- Como visualizar a OpenAPI / Swagger
- Próximos passos para o frontend

---

## Visão geral

O Synapse expõe uma API RESTful com documentação OpenAPI (`/api/v1/schema/`) e UI interativa via Swagger (`/api/v1/docs/`) e Redoc (`/api/v1/redoc/`). Esta documentação descreve cada rota, payloads e contratos para integração de um frontend completo.

## Autenticação (detalhado)

Métodos suportados:

- **BasicAuth** — útil para testes rápidos com `curl -u user:pass`.
- **SessionAuth (Cookies)** — usado pelo frontend tradicional (login via formulário).
- **JWT** — recomendado para SPA/Mobile. Gerado via `POST /api/v1/auth/token/` e renovado via `POST /api/v1/auth/token/refresh/`.

Endpoints e exemplos práticos:

### Registrar usuário

- URL: `POST /api/v1/auth/register/`
- Body (JSON):

```json
{
  "username": "aluno1",
  "password": "segredo123",
  "email": "aluno1@example.com"
}
```

- Exemplo curl:

```bash
curl -X POST http://<host>/api/v1/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"aluno1","password":"segredo123","email":"aluno1@example.com"}'
```

- Resposta esperada: `201 Created` com o objeto do usuário (ou campos limitados conforme serializer).

### Obter token JWT (login)

- URL: `POST /api/v1/auth/token/`
- Body (JSON):

```json
{
  "username": "admin",
  "password": "adminpass"
}
```

- Exemplo curl:

```bash
curl -X POST http://<host>/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"adminpass"}'
```

- Resposta (exemplo):

```json
{
  "access": "eyJ...",
  "refresh": "eyJ..."
}
```

- Uso do token nas chamadas subsequentes (Authorization header):

```
Authorization: Bearer <access_token>
```

Exemplo curl com token:

```bash
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://<host>/api/v1/auth/me/
```

### Renovar token

- URL: `POST /api/v1/auth/token/refresh/`
- Body: `{ "refresh": "<refresh_token>" }`

---

## Exemplos por área (Requests & Responses)

Abaixo há exemplos práticos de como usar cada rota relevante — bons para testar e para a equipe frontend implementar os fluxos.

### Cognition (Assessment Sessions) — Exemplos completos

#### Listar sessões

- URL: `GET /api/v1/cognition/sessions/`
- Cabeçalho: `Authorization: Bearer <access_token>` (ou BasicAuth)

Exemplo curl:

```bash
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://<host>/api/v1/cognition/sessions/
```

Resposta (200):

```json
[
  {
    "id": 1,
    "user": 3,
    "lesson": 2,
    "status": "active",
    "started_at": "2026-01-12T10:00:00Z",
    "turns": [],
    "report": null
  }
]
```

#### Criar nova sessão

- URL: `POST /api/v1/cognition/sessions/`
- Body (exemplo): `{ "lesson": 2 }`

Exemplo curl:

```bash
curl -X POST http://<host>/api/v1/cognition/sessions/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"lesson": 2}'
```

Resposta (201):

```json
{
  "id": 10,
  "user": 3,
  "lesson": 2,
  "status": "active",
  "started_at": "2026-01-12T12:34:56Z",
  "turns": [],
  "report": null
}
```

#### Recuperar sessão

- URL: `GET /api/v1/cognition/sessions/{id}/`

```bash
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://<host>/api/v1/cognition/sessions/10/
```

Resposta (200): contém `turns` (lista de `EvaluationTurn`) e `report` quando disponível.

#### Enviar resposta do estudante (action `respond`)

- URL: `POST /api/v1/cognition/sessions/{id}/respond/`
- Body: `{ "content": "Minha resposta aqui" }`

Exemplo curl:

```bash
curl -X POST http://<host>/api/v1/cognition/sessions/10/respond/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "A resposta do estudante."}'
```

Resposta (200) — exemplo:

```json
{
  "llm_response": {
    "text": "Parabéns! Você demonstrou compreensão, ...",
    "inference": { "score": 0.82, "dimensions": {"reasoning": 0.8, "knowledge": 0.85} }
  },
  "session_status": "active"
}
```

- Observações: a ação cria um `EvaluationTurn` para o estudante (`speaker: 'student'`) e outro para o LLM (`speaker: 'llm'`), atualiza `report` se aplicável e registra telemetria.

#### Probe (teste de LLM connectors)

- URL: `POST /api/v1/cognition/sessions/probe/`
- Body (exemplo): `{ "prompt": "Hello", "provider": "mock" }`

Exemplo curl:

```bash
curl -X POST http://<host>/api/v1/cognition/sessions/probe/ \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello", "provider": "mock"}'
```

Resposta (200) — exemplo:

```json
{ "ok": true, "response": { "text": "Parabéns! Você demonstrou compreensão, ..." } }
```

---

### Courses (exemplos principais)

- Listar lições do curso: `GET /api/v1/` (ver `courses` endpoints via OpenAPI). Exemplo genérico:

```bash
curl http://<host>/api/v1/courses/ -H "Authorization: Bearer $ACCESS_TOKEN"
```

Resposta: lista de `Course` com `Lesson`s aninhadas.

### Sandbox (executar código)

- URL: (ver schema) — normalmente: `POST /api/v1/sandbox/execute/` ou `POST /api/v1/sandbox/jobs/`
- Body (exemplo): `{ "language": "python", "code": "print(2+2)" }`

Exemplo curl:

```bash
curl -X POST http://<host>/api/v1/sandbox/execute/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"language": "python", "code": "print(2+2)"}'
```

Resposta (200): saída e status da execução.

### Submissions (problems / submissions)

- Criar `Problem` (se for admin/autor): `POST /api/v1/submissions/problems/`
- Enviar `Submission`: `POST /api/v1/submissions/submissions/` com `{ "problem": <id>, "content": "..." }`

---

## Tratamento de erros (prática)

- `400 Bad Request` — validação do payload falhou.
- `401 Unauthorized` — faltou token válido.
- `403 Forbidden` — ação não permitida para o usuário.
- `404 Not Found` — recurso não existe.
- `500 Internal Server Error` — erro no servidor (investigar logs e telemetria).

### Cabeçalhos recomendados

- `Content-Type: application/json`
- `Authorization: Bearer <token>`

---

## Boas práticas e patterns

- Use o endpoint `/api/v1/schema/` para gerar clients e garantir tipagem estável.
- Teste o `probe` sempre que trocar provedor de LLM (mock → openai/gemini/ollama).
- Armazene `report` e `turns` localmente (ou em cache) para renderização rápida no frontend.

---

(As outras seções do documento permanecem; adicionei exemplos práticos e respostas amostrais para os principais fluxos.)

---

## Endpoints Principais

### Cognition (Avaliação)

- `GET /api/v1/cognition/sessions/` — listar sessões do usuário
- `POST /api/v1/cognition/sessions/` — criar nova `AssessmentSession` (payload: `lesson`)
- `GET /api/v1/cognition/sessions/{id}/` — recuperar sessão
- `PUT /api/v1/cognition/sessions/{id}/` — atualizar sessão
- `POST /api/v1/cognition/sessions/{id}/respond/` — (action) enviar a resposta do estudante (implementado via viewset action `respond`)
- `POST /api/v1/cognition/sessions/probe/` — endpoint de teste para sondar LLM connectors com `prompt` (útil em E2E)

Observação: Muitos endpoints esperam usuário autenticado (ver segurança no OpenAPI).

#### Probe (teste de LLM)

- Request: `{ "prompt": "text", "provider": "mock" }`
- Response: `{ "ok": true, "response": { ... } }`

### Courses

Endpoints relacionados a `Course` e `Lesson` (CRUD). Use-os para criar conteúdo ligado a uma `AssessmentSession` (campo `lesson`).

### Sandbox

APIs para execução de código/compilação (útil para problemas de programação e ambientes de avaliação automática).

### Submissions

APIs para criar e listar `Problems` e `Submissions` (plataforma de exercícios).

---

## Modelos e Campos (Importante para o Frontend)

### AssessmentSession
- `id` (int)
- `user` (FK) — proprietário da sessão
- `lesson` (FK) — lição/questão associada
- `status` (string) — `active`, `converged`, `failed`
- `started_at`, `updated_at`
- `metadata` (JSON)
- `turns` (array) — lista de `EvaluationTurn` (campo aninhado no serializer)
- `report` (object) — `CognitiveReport` (aninhado)

### EvaluationTurn
- `id`
- `speaker` — `'student'` ou `'llm'`
- `content` — texto
- `timestamp`
- `inference` — JSON (análise produzida pelo LLM)

### CognitiveProfile
- `user` (OneToOne)
- Métricas agregadas (floats): `conceptual_understanding`, `causal_reasoning`, `transfer_ability`, `error_detection`

### CognitiveReport
- `score` (float)
- `summary` (text)
- `dimensions` (JSON) — breakdown por dimensão
- `convergence_details`
- `created_at`

---

## Fluxos de sessão (Casos de Uso)

1. Criar sessão
   - `POST /api/v1/cognition/sessions/` com `{ "lesson": <lesson_id> }` cria sessão em `status: active`.
2. Estudante envia resposta
   - `POST /api/v1/cognition/sessions/{id}/respond/` com `{ "content": "resposta do aluno" }` → orquestrador chama LLM, adiciona `turns` (student + llm), atualiza `report` e possivelmente marca `converged`.
3. Consultar sessão
   - `GET /api/v1/cognition/sessions/{id}/` retorna `turns` e `report` para renderização do UI.
4. Probe
   - `POST /api/v1/cognition/sessions/probe/` para verificar conectividade e respostas esperadas do LLM.

---

## Visualizar a OpenAPI / Swagger

- JSON/YAML: `GET /api/v1/schema/` (salvo também em `docs/openapi.json` no repositório)
- Swagger UI: `GET /api/v1/docs/`
- Redoc: `GET /api/v1/redoc/`

Ex.: Abra `http://<host>/api/v1/docs/` e teste interativamente todos os endpoints com tokens JWT ou BasicAuth.

---

## Recomendação para o Frontend (arquitetura e páginas)

Prioridade inicial (MVP):

1. Painel de Sessões (Lista)
   - Mostrar `id`, `lesson.title`, `status`, `started_at`, `score` (se existir)
   - Ações: `Abrir`, `Criar nova sessão`
2. Visualizador de Sessão
   - Lista de `turns` (ordenadas por `timestamp`), com distinção visual entre `student` e `llm` e possibilidade de copiar/editar a última resposta do estudante para re-submissão.
   - Área de `report`: `score`, `summary`, `dimensions` (gráficos)
3. Criador de Sessões / Iniciar Avaliação
   - Selecionar `lesson`, opções de metadata (tempo limite, nível, etc.)
4. Ferramenta de Administração
   - CRUD de `courses`, `lessons`, visualização de `cognitive_profiles` e `reports`.

Sugestões técnicas:
- Usar o `openapi.json` para gerar um client SDK (ex.: TypeScript client via `openapi-generator` ou `swagger-codegen`).
- Autenticação via JWT para separar API e UI.
- Componentes React: `SessionList`, `SessionView`, `Turn`, `ReportCard`.

---

## Próximos passos que posso executar agora

- Gerar um `openapi.ts` (TypeScript client) a partir de `docs/openapi.json` e comitar no repositório.
- Escrever templates iniciais em React (Vite + React + Tailwind) com páginas MVP.
- Criar páginas estáticas `docs/front_end_plan.md` com UX e dados de API por componente.

---

Se quiser, eu gero agora o SDK TypeScript e um protótipo mínimo de frontend (Vite + React) com listas e visualização de sessões — quer que eu siga com isso agora?