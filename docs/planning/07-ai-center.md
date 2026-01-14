# Planejamento — AI Center

## Resumo do Módulo (padrão)

| Campo | Descrição |
| --- | --- |
| Módulo | AI Center / Console |
| Elementos críticos | Select de provider/modelo; Console streaming (logs); Botão "Executar"; WS status; Salvar sessão / permalink; Resource usage indicators |
| Lacuna | Logs não persistidos; Falta de command_id/session_id consistente; WS status e reconexão invisíveis; Falta de cost estimates pré-execução |
| Sugestão | Persistir sessions/commands/logs; Commands API (command_id); WS status UI with queue/replay; Save session permalink with permissions; token usage alerts; emit S1a/S2/S3/S4 (FE/BE/UX/QA) |
| Responsabilidade | Backend / Frontend / UX / QA / Infra |
| Impacto | Aumenta confiança e uso do AI Center; reduz MTTR de falhas; controla custos inesperados |
| KPI | MAU/DAU for AI Center; number of failed executions; average cost per execution |
| Prioridade | Alta |
| Telemetria | S1a: `s1a.ai.exec.v1` {session_id, command_id, user_id, model, estimated_cost, correlation_id}; S2: WS state events; S3: token usage; S4: logs persisted/size/location |

**Resumo:** Melhorar confiabilidade, rastreabilidade, feedback de execução e controle de custos no Console/AI Workspace por meio de persistência de logs/sessões, melhorias de reconexão, enfileiramento de comandos e telemetria de uso.

> Nota: Todos os eventos emitidos por este módulo devem incluir `correlation_id`. Preencher o campo `Responsabilidade` com nome/alias do owner antes de mover para sprint.

---

## 1. Elementos críticos
- **Select de provider/modelo** (modelo, engine, runtime, provider) — opções, versão e parâmetros.
- **Console streaming** (stdout/stderr, logs em tempo real, eventos de sistema).
- **Botão "Executar / Run / Submit"** com feedback imediato e ligação a `session_id`.
- **Status do WebSocket / Conexão** (online, connecting, disconnected, reconnecting).
- **Botão "Salvar sessão" / Compartilhar permalink** (persistir sessão e comando history).
- **Indicadores de uso de recursos** (tokens, quota, estimativa de custo por execução).
- **Mensagens de erro/status** (timeout, desconexão, retries, backoff, fail/retry).
- **Histórico de comandos e resultados** (timeline por session_id / command_id).

---

## 2. Diagnóstico de lacunas (por elemento)
- **Select de provider/modelo**: Falta de sinais de compatibilidade e parâmetros; escolhas não rastreadas por sessão.
- **Console streaming**: Logs não persistidos; histórico inacessível; dificuldade de navegação/filtragem.
- **Botão Executar**: Falta de confirmação/rastreamento de execução (sem command_id ligado a events).
- **Status WS**: Reconexão invisível; falhas silenciosas; sem indicação de enfileiramento de comandos.
- **Salvar sessão / permalink**: Não existe ou é pouco promovido; recuperação parcial de contexto.
- **Indicadores de uso**: Ausência de alertas proativos e estimativas de custos por execução.
- **Mensagens de erro**: Feedback insuficiente (ex.: retry/backoff desconhecidos para o usuário).
- **Rastreabilidade**: Ausência de IDs consistentes (session_id, command_id, user_id) em eventos e logs.

---

## 3. Sugestões de melhoria
- **Persistir logs e sessões** por `session_id` (DB ou S3) com índices para pesquisa e retenção configurável.
- **Histórico completo** de comandos (`command_id`, input, output, exit_code, timestamps) acessível na UI.
- **Status indicator do WS** com tooltip e ação de reconnect manual/auto e contador de tentativas.
- **Enfileiramento de comandos** pendentes durante reconexões e execução automática quando online.
- **CTA para salvar sessão** e gerar permalink; incluir metadados (user_id, session_id, tags).
- **Alertas de uso de tokens/quotas** (bandeira amarilla/vermelha) e estimativa de custo pré-execução.
- **Feedback visual**: skeletons/spinners durante execução, toasts para sucesso/erro, e logs em tempo real com marcação de evento.
- **Instrumentação e telemetria**: garantir emissão de eventos S1a/S2/S3/S4 com payloads consistentes.
- **Controle de permissões**: restringir visualização/compartilhamento conforme roles (instrutor/admin/dev/user).

---

## 4. Plano de implementação
### Backend
- Criar CRUD de sessions: `POST /ai/sessions/`, `GET /ai/sessions/`, `GET /ai/sessions/<id>/`.
- Persistir logs: `POST /ai/sessions/<id>/logs/` e `GET /ai/sessions/<id>/logs/` (paginação + filtros).
- Registrar comandos: `POST /ai/sessions/<id>/commands/` (gera `command_id`), armazenar resultado e métricas de custo.
- Telemetria: emitir S1a (execução/salvamento), S2 (status WS), S3 (token usage), S4 (logs persistidos).
- Integração com armazenamento (S3/Blob) para logs grandes e DB para metadados.

### Frontend
- Status indicator do WS com ações: reconnect manual, mostrar último evento e número de tentativas.
- Painel de logs persistidos com busca/filtro por `command_id`, nível (info/warn/error) e timestamps.
- Enfileiramento de comandos na UI quando offline/reconnect e replay automático após reconexão.
- Botão "Salvar sessão" que gera permalink e chama backend para persistir snapshot (metadata + logs resumidos).
- Badge/indicator de token usage com thresholds configuráveis e tooltip com estimativa de custo.
- UX de feedback: skeletons, spinners, toasts, e modais para confirmação quando operações custosas forem executadas.

### UX / Product
- Mostrar estimativa de custo pré-execução e alerta se ultrapassar thresholds.
- Permitir compartilhar sessão com permissões (read-only / read-write) e expiração do link.
- Mapear personas (instrutor/admin, usuário final, desenvolvedor) e ajustar prioridades de features.

### QA
- Simular desconexões e validar enfileiramento/retry/replicação de comandos.
- Testar persistência e retenção de logs, paginação e buscas.
- Validar emissões de eventos de telemetria com payloads corretos.

---

## 5. Critérios de validação
- Logs e histórico de comandos acessíveis via `/ai/sessions/<id>/logs/` e `/ai/sessions/<id>/commands/`.
- Reconexão (manual/automática) executa comandos pendentes e não perde comandos confirmados como enviados.
- Evento **S1a** emitido ao "Executar" e ao "Salvar sessão" com `session_id`, `user_id`, `command_id` quando aplicável.
- Evento **S2** rastreia mudanças de estado do WS (connecting, connected, disconnected, reconnecting).
- Evento **S3** (token usage) refletindo custo estimado e real por execução.
- Skeleton/spinner visível durante execução e toasts claros para sucesso/falha.
- Permissões e expiração de permalinks funcionando conforme política.

---

## 6. Impacto esperado nos KPIs
- ✅ **Aumenta confiança e uso** do AI Center / Console (MAU/DAU) por maior previsibilidade.
- ✅ **Reduz MTTR** (tempo de recuperação) e número de tickets de suporte relacionados a desconexões.
- ✅ **Maior rastreabilidade** das ações do usuário (auditoria, compliance).
- ✅ **Melhora na percepção de controle** do usuário (menor churn em funcionalidades avançadas).
- ✅ **Redução de custos inesperados** por alertas proativos de token usage.

---

## 7. Prioridade
- **Alta**: Persistência de logs/sessions, status WS visível e enfileiramento de comandos.
- **Média**: Token usage UI e alertas proativos, permalinks com permissões.
- **Baixa**: UX avançada de sharing (expiração personalizada, previews) e integrações com billing detalhado.

---

## 8. Telemetria sugerida
| Evento | Descrição |
|---|---|
| **S1a** | Execução de comando, salvar sessão, compartilhar permalink — inclui `session_id`, `user_id`, `command_id`, `model`, `estimated_cost` |
| **S2** | Status do WebSocket / conexão — inclui `session_id`, `state`, `attempts`, `timestamp` |
| **S3** | Consumo de recursos / token usage — inclui `session_id`, `command_id`, `tokens_used`, `cost` |
| **S4** | Logs persistidos / histórico salvo — inclui `session_id`, `log_size`, `location` (S3/DB) |

---

## 9. Tickets sugeridos
- [ ] FEAT: Persistência de logs e sessions CRUD (`/ai/sessions/`) — Backend + DB + Telemetria S4
- [ ] FEAT: Commands API (`/ai/sessions/<id>/commands/`) com `command_id` e resultados — Backend + Frontend
- [ ] FEAT: UI de status/reconnect + enfileiramento de comandos — Frontend + QA + Telemetria S2
- [ ] ENH: Integração de token usage com alertas e billing (S3 → S3 integration) — Telemetria S3 + Notifications
- [ ] UX: Botão "Salvar sessão" / Permalink com permissões e expirations — Frontend + Backend
- [ ] QA: Test-suite de reconexão, replay de comandos e persistência de logs

---

> **Nota:** Priorizar persistência de logs e status do WS primeiro — isso traz maior impacto na confiança do usuário e reduz suporte manual. Para desenvolvimento, comece com APIs mínimas viáveis (sessions + logs + commands) e evolua a UI/alertas em sprints subsequentes.

---

## 10. Contratos de API (exemplos) 🔧
- **POST /ai/sessions/**
  - Request: `{ "user_id": "uuid", "metadata": {...} }`
  - Response: `201 { "session_id": "uuid", "created_at": "..." }`
- **GET /ai/sessions/<id>/**
  - Response: `200 { "session_id": "...", "user_id": "...", "status": "active", "created_at": "..." }`
- **POST /ai/sessions/<id>/commands/**
  - Request: `{ "input": "...", "metadata": {"model":"gpt-x","timeout_ms":...} }`
  - Response: `201 { "command_id":"uuid", "status":"queued" }`
- **GET /ai/sessions/<id>/logs/**
  - Query: `?level=info|warn|error&limit=50&offset=0&command_id=...`
  - Response: `200 { "logs": [{ "log_id":"...","level":"info","ts":"...","msg":"..." }], "next": "..." }`

## 11. Telemetria — payloads exemplares 📡
- **S1a (Execução / Salvar / Share)**
  - `{ "event": "S1a", "session_id": "uuid", "command_id": "uuid?", "user_id": "uuid", "model": "gpt-x", "estimated_cost": 0.12, "status": "started|completed|failed", "duration_ms": 1234, "timestamp": "..." }`
- **S2 (WS state change)**
  - `{ "event": "S2", "session_id": "uuid", "state": "connecting|connected|disconnected|reconnecting", "attempts": 3, "last_error": "...", "timestamp": "..." }`
- **S3 (Token usage / Cost)**
  - `{ "event": "S3", "session_id": "uuid", "command_id": "uuid", "tokens_estimated": 120, "tokens_used": 142, "estimated_cost": 0.12, "actual_cost": 0.14, "timestamp": "..." }`
- **S4 (Logs persistidos)**
  - `{ "event": "S4", "session_id": "uuid", "log_id": "uuid", "log_size_bytes": 43210, "storage_location": "s3://bucket/path", "first_ts":"...","last_ts":"..." }`

> Nota: padronizar nomes de eventos e campos, versionar o schema e validar via contract tests.

## 12. Critérios de aceitação / Test cases ✅
- Dado um usuário conectado, quando executar um comando, então o sistema deve emitir **S1a** com `session_id` e `command_id`, persistir o comando e retornar `command_id`.
- Dado um corte de conexão WS, quando reconectar, então comandos enfileirados devem ser executados automaticamente e emitir eventos S2 e S1a correspondentes.
- Dado uma execução longa/verbose, quando os logs ultrapassarem X KB, então os logs devem ser armazenados em S3 e emitir S4 com `location`.
- Dado execução que consome tokens acima do threshold, quando o usuário tentar executar, então mostrar alerta e parar execução se policy exigir.

## 13. QA — Checklist detalhado 🧪
- [ ] Testar reconexão automática com 0, 1 e N comandos enfileirados (verificar replay)
- [ ] Testar reconnect manual via botão e ver contador de tentativas/status
- [ ] Validar persistência de logs e paginação em `/ai/sessions/<id>/logs/`
- [ ] Validar emissão e schema dos eventos S1a/S2/S3/S4 (contract tests)
- [ ] Simular falhas de provider/model e validar mensagens de erro e retry/backoff
- [ ] Testar permissões de permalink (read-only vs read-write) e expiração

## 14. Tickets priortizados (exemplo) 🗂️
| Ticket | Descrição curta | Estimativa | Prioridade |
|---|---:|---:|---:|
| FEAT-001 | CRUD `sessions` + basic persistence (DB) | 3d | Alta |
| FEAT-002 | Commands API (`/commands/`) com `command_id` + basic queue | 4d | Alta |
| FEAT-003 | Persistência de logs + S3 offload + S4 emit | 3d | Alta |
| FEAT-004 | WS status indicator + reconnect UI + queue replay | 3d | Alta |
| FEAT-005 | Token usage badge + pre-exec estimate + alerts | 2d | Média |
| ENH-001 | Permalink sharing + perms + expiry | 2d | Média |
| QA-001 | Test-suite reconnection/telemetry contract tests | 2d | Alta |

---

## Próximos passos 🎯
1. Criar os tickets acima no board e estimar com time (incluir owners).  
2. Implementar FE + BE mínimos para `sessions` + `commands` + logs (prova de conceito).  
3. Adicionar contract tests de telemetria e QA scripts para reconexão/replay.

---

**Resumo:** Documento atualizado com contratos, exemplos de payload, critérios de aceitação e uma lista priorizada de tickets para viabilizar um MVP robusto do AI Center — foco inicial em persistência de logs, status do WS e enfileiramento de comandos.

