# LLM Connector (POC)

Este documento descreve a POC do conector LLM, compatível com Ollama, OpenAI e um endpoint REST genérico (ex.: Gemini).

## Configuração por variável de ambiente
- LLM_PROVIDER: `ollama` | `openai` | `gemini` | `mock` (default: mock)
- OLLAMA_HOST: URL do serviço Ollama (ex.: http://localhost:11434)
- OPENAI_API_KEY: chave da OpenAI
- GEMINI_ENDPOINT: URL do endpoint Gemini REST compatível
- GEMINI_API_KEY: chave para Gemini

## Como usar
- Endpoint de teste do CAE: POST /api/v1/cognition/sessions/probe/ (autenticado)
  Payload: {"prompt": "Explique...,", "provider": "ollama", "model": "llama2"}

## Exemplos de integração
### Ollama (POC)
curl -X POST "${OLLAMA_HOST}/api/v1/generate" -d '{"model":"llama2","prompt":"Hello"}'

### OpenAI
POST https://api.openai.com/v1/chat/completions
Headers: Authorization: Bearer $OPENAI_API_KEY
Body: {"model":"gpt-4o-mini","messages":[{"role":"system","content":"..."},{"role":"user","content":"..."}]}

### Gemini (Generic REST)
Forneça `GEMINI_ENDPOINT` que aceita JSON {model, system, prompt, temperature}

## Observability & Safety
- Logar `raw` responses (hash sensitive content) e `inference` JSON separadamente.
- Rate-limiting e retries devem ser adicionados em produção.
