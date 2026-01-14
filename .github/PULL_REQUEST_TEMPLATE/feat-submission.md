**Title:** FEAT: Submission history & streaming logs + "Pedir revisão"

**Description**
- Adiciona endpoints para histórico de submissões e streaming de logs
- Implementa frontend `SubmissionHistory` e `SubmissionLogs` com SSE/WS fallback
- Telemetria: envia S1a/S2/S4 com schema definido
- Testes E2E (Cypress/Playwright) cobrindo submit, streaming, retry e request-review

**How to test**
1. Backend + frontend up
2. Open lesson page with a code editor
3. Submit code, observe spinner, streaming logs and history update
4. Simulate job failure and test retry + request review

**Acceptance criteria / QA checklist**
- [ ] `GET /api/lessons/{id}/submissions/?lesson_id=` retorna histórico com `submission_id`, `status`, `timestamp`
- [ ] Streaming logs (SSE/WS) exibem logs em tempo real
- [ ] `POST /api/submissions/` cria submissão e retorna `submission_id`
- [ ] S1a enviado no click com `{ submission_id, lesson_id, user_id }`
- [ ] Em caso de falha, toast com mensagem contextual e botão **Retry**
- [ ] CTA **Pedir revisão** cria ticket e notifica usuário
- [ ] E2E tests passam no CI
- [ ] Documentação atualizada (`docs/telemetry/lesson-submission-payloads.md`)

**Notes**
- Coordenar com analytics para rollout do novo schema
- Documentar limitações do streaming (timeouts / reconnect)
