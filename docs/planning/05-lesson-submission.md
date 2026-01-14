# Planejamento — Aula / Submissão

## Resumo do Módulo (padrão)

| Campo | Descrição |
| --- | --- |
| Módulo | Aula / Submissão |
| Elementos críticos | CodeEditor; Botão "Submeter Resposta"; Feedback (success/error); SubmissionHistory; Streaming logs |
| Lacuna | Não há histórico de submissões; Feedback pobre (somente sucesso/falha); Falta de streaming de logs; Ausência de CTA para pedir revisão/ajuda |
| Sugestão | Implementar SubmissionHistory UI; SSE/WS logs streaming; CTA "Pedir revisão" integrando AI Center ou ticket; ETA/progress indicators; S4 history persistence (FE/BE/UX/QA) |
| Responsabilidade | Backend / Frontend / UX / QA / AI Center |
| Impacto | Aumento na taxa de sucesso de submissões; Redução do tempo entre tentativas; Menos tickets de suporte |
| KPI | Taxa de sucesso de submissões; tempo médio até retry; redução de tickets de suporte |
| Prioridade | Alta |
| Telemetria | S1a: `s1a.submission.create.v1` {submission_id, lesson_id, user_id, correlation_id}; S2: job status updates; S4: history viewed/recorded |

**Resumo:** Melhorar o fluxo de submissão adicionando histórico de envios, streaming de logs, CTA de ajuda/revisão e indicadores de progresso para fornecer feedback mais rápido e acionável.

> Nota: Todos os eventos emitidos por este módulo devem incluir `correlation_id`. Preencher o campo `Responsabilidade` com nome/alias do owner antes de mover para sprint.

## Elementos críticos
- **CodeEditor**
- **Botão “Submeter Resposta”**
- **Feedback** (success/error + detalhes do resultado)

## Diagnóstico
- Não há histórico de submissões
- Feedback pouco informativo (somente sucesso/falha)
- Falta CTA para pedir revisão/ajuda
- Logs de execução não são visíveis em tempo real

## Sugestões
- Adicionar painel lateral com **Histórico de Submissões** (status, timestamp, resumo do resultado)
- Implementar **streaming de logs** (stdout/stderr) durante execução (SSE ou WebSocket)
- Adicionar CTA **“Pedir revisão”** que cria um ticket interno ou abre o assistente de IA
- Indicar claramente o próximo passo após sucesso/erro (ex.: “Próxima aula”, “Revisar”)

## Plano de implementação
1. **Backend**
   - Endpoint: `GET /submissions/?lesson_id=<id>` (listagem paginada)  
   - Endpoint: `POST /submissions/` (criar submissão) → retorna `submission_id`
   - Streaming: suporte a **SSE** ou **WebSocket** para logs do job (`/submissions/<id>/logs/stream`)
   - Armazenamento do histórico: modelo DB com metadados (status, timestamps, result_summary) e S3 para artefatos grandes (se necessário)
2. **Frontend**
   - Componente `SubmissionHistory` (lista + filtros por `lesson_id`)
   - Componente `SubmissionRun` que consome streaming de logs com reconexão/heartbeat
   - CTA `Pedir revisão` (integra com AI Center ou ticket system)
3. **UX**
   - Mostrar ETA/indicador de progresso, botões de ação após resultado
   - Mensagens de erro com links para logs e “Pedir revisão”
4. **QA**
   - Testar perda de conexão e retry (SSE/WS reconnection)
   - Validar payloads, rate limiting e tolerância a falhas

### Critérios de validação
- Histórico de submissões listado com **tempo**, **status** e **resumo do resultado**
- Streaming mostra logs em tempo real e lida corretamente com timeouts e reconexões
- Evento **S1a** emitido na submissão com payload contendo `submission_id`, `lesson_id`, `user_id`
- Criterios de segurança e rate-limiting aplicados

## Impacto no KPI
- Aumento na taxa de sucesso de submissão
- Redução do tempo entre tentativas (feedback mais rápido)
- Redução de tickets de suporte relacionados a submissões

## Prioridade
- **Alta** ✅

## Telemetria
- **S1a**: envio/submissão (payload ex.: `{ submission_id, lesson_id, user_id, timestamp }`)
- **S4**: histórico de submissões visto (event: `view_submission_history`)
- **S2**: status do job (started, completed, failed, duration)

---

## Tickets sugeridos
- [ ] **BE:** API de submissões por `lesson_id` (list, create, show)
- [ ] **BE/Infra:** Streaming de logs (SSE/WS) e storage de logs/artefatos (S3/DB)
- [ ] **FE:** `SubmissionHistory` + `SubmissionRun` (streaming + UI de logs)
- [ ] **FE/UX:** CTAs “Pedir revisão”, “Próxima aula”, mensagens de erro ricas
- [ ] **QA:** Testes de reconnect / rate-limiting / payload validation
- [ ] **TELEMETRIA:** Implementar eventos S1a, S2, S4 com schemas