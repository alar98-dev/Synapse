# API - Cognitive Assessment Engine (CAE)

## Endpoints

### POST /api/v1/cognition/sessions/
Cria uma nova sessão de avaliação para um `lesson_id`.
Payload:
{
  "lesson": 12
}
Response:
- 201: sessão criada com `id` e `status: active`

### GET /api/v1/cognition/sessions/{id}/
Retorna o estado da sessão: turns e relatório (quando existir).

### POST /api/v1/cognition/sessions/{id}/respond/
Envia um texto do aluno para a sessão.
Payload:
{
  "content": "Minha explicação sobre o porquê..."
}
Response:
{
  "llm_response": "...",
  "session_status": "active|converged"
}

## Esquemas
- `AssessmentSession` — `id`, `user`, `lesson`, `status`, `started_at`, `turns[]`, `report`
- `EvaluationTurn` — `id`, `speaker`, `content`, `timestamp`, `inference`
- `CognitiveReport` — `score`, `summary`, `dimensions`, `created_at`

## Observability
- Logar cada request e resposta do LLM (hash do conteúdo quando PII suspeito) e armazenar `inference` para auditoria.
- Medir métricas: `session_created`, `session_converged`, `avg_turns_to_converge`.
