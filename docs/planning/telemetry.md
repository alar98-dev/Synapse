# Telemetria — S1a–S4 Mapping

Objetivo: padronizar eventos S1a–S4 para todas as ações críticas, garantindo rastreabilidade e auditoria.

## Padrão de eventos
- S1a (Evento de interação): clique em CTA, open modal, submit, upload. Payload mínimo: {event, user_id, timestamp, entity_ids}
- S2 (Estado): mudanças de estado de recursos (alert resolved, session status, submission status)
- S3 (Sistema / Infra): eventos relacionados a integrações (pagamento/stripe, WS status, storage)
- S4 (Audit log): registros persistidos para auditoria (intervenções, mudanças de curso, submissões importantes)

## IDs obrigatórios
- `user_id`, `session_id`, `course_id`, `lesson_id`, `submission_id`, `story_id`

## Exemplo: submissão de aula
- S1a: `submission_attempt` -> {user_id, lesson_id, course_id, timestamp}
- S2: `submission_status` -> {submission_id, status}
- S4: `submission_history` -> armazenar logs e resultado completo

## Guia de implementação
1. Definir schema de eventos em backend (prod: kafka/topic/event-v1)
2. Normalizar chaves e nomes (snake_case)
3. Emissão no frontend com fallback local (enqueue) para perda de conexão
4. Documentar cada evento no `docs/planning/telemetry.md` e linkar tickets

## Tickets sugeridos
- [ ] DOC: Especificação de schema de eventos S1a–S4
- [ ] FEAT: Emissão de S1a no frontend para CTAs críticos
- [ ] FEAT: Persistência S4 para intervenções e submissões críticas