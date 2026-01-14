**Integração LLM — Orientações Operacionais**

Resumo rápido:

- É proibido usar _mocks_ end-to-end na plataforma para chamadas LLM em produção ou ambientes que simulam produção. O conector LLM deve integrar-se diretamente ao backend (implementação real do `LLMConnector`).
- Em dev local é aceitável usar provider `mock` somente para experimentação rápida, mas nenhum fluxo do produto deve depender de mocks ao implementar funcionalidades reais (CAE, feedback, scoring).

Regras e responsabilidades:

1. Implementação direta no backend
   - Todas as integrações com provedores LLM (OpenAI, Ollama, Gemini, etc.) devem ser feitas em `cognition/llm_connector.py` ou em um novo conector sob `cognition/connectors/`.
   - O backend chama o conector diretamente; não introduzir camadas de mock entre a API e o conector.

2. Configuração por variáveis de ambiente
   - `LLM_PROVIDER` — provedor ativo (`openai|ollama|gemini|mock`).
   - `OPENAI_API_KEY`, `OLLAMA_HOST`, `GEMINI_ENDPOINT`, `GEMINI_API_KEY` conforme necessário.

3. Telemetria e segurança
   - Logue apenas metadados e hashes de payloads sensíveis; não persistir PII em texto claro.
   - Emita eventos de telemetria (turn_success, turn_failed, invalid_llm_response, provider_circuit_open, provider_blocked, fallback_used, provider_recovered) via o mecanismo de `telemetry` do `LLMClient`.
   - Registrar latências, tentativas e códigos de erro para operações de observabilidade.

4. Circuit breaker e retry
   - Use o `CircuitBreaker` já presente no POC para evitar chamadas repetidas a provedores indisponíveis.
   - Políticas de retry devem distinguir `retryable` vs `non-retryable` errors; não retry em invalid responses.

5. Validação de respostas
   - Validar `text` e `raw` seguindo as regras do CAE (não vazio, não degenerado, tamanho mínimo, `raw` com campos esperados).
   - Em caso de resposta inválida, registrar evento `invalid_llm_response` e acionar fallback claro (ex.: mensagem controlada, não revelar conteúdo inseguro).

6. Segurança operacional
   - Rate-limit outbound calls; adicionar retries exponenciais com cap.
   - Use secrets manager (Vault / cloud secrets) para chaves em produção.
   - Nas integrações com Ollama local, a comunicação deve ser somente do backend para o host configurado (ex.: `OLLAMA_HOST`).

7. Testes e CI
   - Nos testes unitários do backend, isolar componentes do conector com doubles quando for estritamente necessário para testar comportamento local do circuito/telemetria (ex.: classe `LLMConnector` substituída em unit tests), mas NÃO usar mocks no fluxo de integração / staging que valida contrato com provedores.
   - Para testes end-to-end que verificam integração com um provedor real, criar um ambiente staging com chaves reais/seguras e rate-limiting aplicado.

8. Operacional: fallback e políticas
   - Definir fallback claro: quando provider indisponível, CAE deve retornar resposta controlada com `fallback_used` no telemetria; não retornar texto inválido ou parcial.

Checklist mínimo para entregar integração LLM sem mocks

- [ ] Conector implementado em `cognition/llm_connector.py` ou `cognition/connectors/*`.
- [ ] Variáveis de ambiente documentadas e `docs/llm_connector.md` atualizadas.
- [ ] Telemetria integrada e configurável (dev vs prod).
- [ ] Circuit breaker + retry policy testados (unit tests).
- [ ] Validação de respostas e sanitização (PII filtering) implementadas.

Observação final:

Por decisão de produto, o uso de mocks é proibido em fluxos que criam valor de produto e serão entregues ao usuário final. Use environment `mock` apenas para demos locais e não para features integradas.
