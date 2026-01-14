# Fluxo Dimensional: Observador do Enrolamento

## Nome do fluxo
**Observador Dimensional do Enrolamento** — representa o caminho completo do evento `CourseEnrollment` como vetor dimensional, desde o input (solicitação do aluno) até o output monitorado pelo n8n.

## Descrição textual do fluxo

1. **Input inicial** — o aluno envia a requisição `POST /api/v1/courses/{course_id}/enroll/` com o campo `cohort` e o token JWT. O contrato é:

```json
{
	"cohort": 7
}
```

Headers obrigatórios: `Authorization: Bearer <token>` e `Content-Type: application/json`.

Internamente o sistema captura identidade, contexto de curso/cohort, dependências e risco, construindo um `EventVector` com `EventDimensions` (identidade, contexto, dependência e risco) e payload (`course_id`, `cohort`, `caller`).
2. **Superposição e memória (S1a/S1b)** — o agente dimensiona o evento e chama `advance_state` para S1a e S1b antes de envolver o filamento, garantindo que dados históricos e contexto sejam carregados.
3. **Filamento (S2)** — o `FilamentDecisionService` avalia identidade, contexto e risco, retorna `FilamentDecision` (ACEITAR/AJUSTAR/BLOQUEAR) e registra um `FilamentAuditEntry` contendo timestamp, estado, decisão e snapshot de dimensões/payload. Os `default_filament_hooks` disparam POSTs ao webhook n8n; o workflow responde com os mesmos dados para acionar quaisquer nós LLM/alerta necessários enquanto mantém o painel como observador da sequência.
4. **Persistência (S3)** — quando o filamento permite, a matrícula é persistida (curso, cohort, enrollment). O serviço grava manualmente um novo `FilamentAuditEntry` para o estado S3, enviando novamente o payload via hooks e garantindo que o evento esteja coberto no dashboard do n8n.
5. **Aprendizado (S4)** — imediatamente após a persistência bem-sucedida, o serviço chama `record_learning` com `EventState.S4`, deixando um registro que alimenta o caminho de aprendizado estrutural. Um novo POST para o webhook captura o checkpoint S4, permitindo que o n8n desencadeie tarefas de ajuste, alerta ou enrichments.
6. **Output observado** — o aluno recebe a resposta HTTP (201 ou ajuste/bloqueio com mensagem). O n8n registra a sequência de POSTs (S2, S3, S4), exibindo os estados passados, decisões, razões e timestamps para que os observadores dimensionais tenham visibilidade completa.

## Observadores envolvidos
- **Django CourseViewSet.enroll** — constrói o vetor e dirige a lógica.
- **FilamentDecisionService** — decide, registra, notifica hooks e mantém estado histórico.
- **n8n Webhook & LLM Orquestração** — recebe os POSTs com o JSON de `FilamentAuditEntry`, alimentando dashboards, alertas e, via nós HTTP/Function, disparando chamadas aos LLMs configurados de acordo com a decisão do filamento.

## Inputs/Outputs esperados
- **Input principal**: requisição `POST /courses/{course_id}/enroll/` com payload `{"cohort": 7}` e token do aluno (veja contrato acima).
- **Outputs monitorados**: sequência de webhooks contendo `FilamentAuditEntry` para S2, S3, S4 (cada um com story_id, decisão, reason, timestamp, context_snapshot).
- **Webhook payload**: JSON com vetor, story ID, estado, decisão, razão, timestamp e snapshot de dimensões/payload (conforme README). O n8n registra o recebimento, produz logs e pode seguir com fluxos internos.

### Contrato do webhook n8n
```json
{
	"vector_name": "CourseEnrollment",
	"module": "courses.CourseViewSet.enroll",
	"story_id": "BACKLOG-1234",
	"state": "S2",
	"decision": "ACEITAR",
	"reason": "Evento validado pelo filamento",
	"timestamp": "2026-01-14T11:37:22.123456",
	"context_snapshot": {
		"dimensions": {
			"identidade": {"user_id": 7, "role": "student"},
			"contexto": {"course_id": 5, "cohort_id": 3, "cohort_open": true},
			"dependencia": {"duplicate": false, "cohort_locked": false},
			"risco": {"capacity": 12, "current": 5, "score": 0.5}
		},
		"payload": {"course_id": 5, "requested_cohort": 3, "caller": "user@example.org"}
	}
}
```

## Resultado desejado
Um log completo da trajetória dimensional `S1a → S4`, com decisões auditáveis, hooks acionados e contexto rastreável por story/backlog ID. Isso estabelece a base para reportar colapsos, ajustes e aprendizado contínuo dentro do painel n8n, enquanto mantém o código pronto para replicar o mesmo padrão em outros módulos.

## Execução local do sandbox dimensional

1. Copie [.env.sandbox.example](.env.sandbox.example) para `.env` no ambiente de testes e ajuste apenas o `FILAMENT_WEBHOOK_URL` para o endpoint n8n responsável por registrar tanto os estados quanto os callbacks de LLM/alerta.
2. Rode o script [scripts/setup_dimensional_sandbox.py](scripts/setup_dimensional_sandbox.py) sem argumentos para popular o banco e simular os três cenários de matrícula. Use `--webhook` para apontar a URL desejada do n8n (o LLM será disparado por nós dentro do mesmo workflow), ou `--skip-simulation` para salvar apenas os dados de banco.
3. Analise o JSON enviado para o console (veja o exemplo abaixo) e confirme que os `states` S1a → S4 estão presentes com os motivos, decisões e timestamps alinhados ao backlog `BACK-101`.

```json
{
	"event_vector": "CourseEnrollment#USER123#COURSE456",
	"story_id": "BACK-101",
	"states": [
		{"state": "S1a", "filament": "ACEITAR", "reason": "Identidade verificada", "timestamp": "..."},
		{"state": "S1b", "filament": "ACEITAR", "reason": "Contexto carregado", "timestamp": "..."},
		{"state": "S2", "filament": "ACEITAR", "reason": "Evento validado pelo filamento", "timestamp": "..."},
		{"state": "S3", "filament": "ACEITAR", "reason": "Persistido na sandbox", "timestamp": "..."},
		{"state": "S4", "filament": "ACEITAR", "reason": "Learning checkpoint", "timestamp": "..."}
	],
	"audit_logs_present": true,
	"hooks_triggered": true,
	"validation_status": "PASS"
}
```

### População e artefatos criados

- `scripts/setup_dimensional_sandbox.py` garante que os usuários `USER123`, `ADMIN123`, `INSTRUCTOR123` e `USER_BLOCKED` existam junto aos cursos e coortes `COURSE456` / `COHORT-7`. Para coortes quase cheias, ele popula matriculas extras para estimular a decisão `AJUSTAR`.
- O mesmo script preenche `Enrollment` de suporte e preenche `current`, `capacity` e `score` dos `EventDimensions`, garantindo que o vetor sempre tenha `course_reference` `COURSE456` e `story_id` `BACK-101` para rastreio.

### Observabilidade e diagnósticos n8n

- O reporte JSON acima alimenta o webhook do workflow, que deve persistir cada estado (S2/S3/S4) em tabelas/logs do n8n e disparar alerts `Slack/Email` quando `decision` for `AJUSTAR` ou `BLOQUEAR`.
- Use a resposta do nó final (`Response Mode: Last Node`) para confirmar que o sistema reconheceu o payload e, se necessário, dispare nós adicionais (`HTTP Request` ou `Set`) para comunicar de volta o checkpoint de aprendizado.
- Registre os relatórios produzidos pelo script como `audit_logs` e vincule-os ao dashboard dimensional para comparação com os POSTs recebidos.

## Prompt Master — Setup e População de Ambiente Dimensional

### 1️⃣ Criar Ambiente de Teste / Sandbox
- Gere uma base isolada (Postgres/SQLite/MongoDB conforme a stack) e crie os esquemas básicos para `User`, `Course`, `Cohort` e `Enrollment`.
- Popule com testes-chave: um aluno padrão (`student`), um administrador e um instrutor; cursos com capacidade limitada e ilimitada; coortes com vagas abertas e algumas quase cheias que simulam bloqueio ou ajuste.
- Defina variáveis de ambiente no `.env` da sandbox contendo URLs de API internas, chaves de webhook n8n e tokens JWT de teste, deixando a orquestração de LLMs para os nós HTTP/Function configurados diretamente dentro do workflow.
- Garanta que cada tabela tenha identificadores previsíveis (`USER123`, `COURSE456`, etc.) para facilitar a geração de EventVectors replicáveis.

### 2️⃣ Popular Evento Dimensional — CourseEnrollment
- Construa um `EventVector` onde `identidade` = `USER123` (aluno de teste) e `contexto` = `COURSE456` (curso/coorte incluídos nos dados inicializados).
- Inclua dependências como matrícula prévia e pré-requisitos, além de campos de risco (capacidade, duplicidade, status do coorte).
- Use o payload simulado `{ "course_id": "COURSE456", "cohort": 7, "caller": "user+sandbox@example.org" }` e assegure que `story_id` seja `BACK-101` para rastreio.
- Processe o vetor chamando `advance_state` para S1a/S1b e, em seguida, o `FilamentDecisionService` para S2, registrando decisões (`ACEITAR`, `AJUSTAR`, `BLOQUEAR`) e gravando audit entries com timestamp e snapshot completo.
- Logue cada estado (S1a, S1b, S2, S3, S4) na mesma trilha, incluindo motivo (`reason`) e decisão do filamento.

### 3️⃣ Configurar Webhook / n8n Observer
- No n8n, crie um workflow com `Webhook` configurado para `POST http://72.61.216.70:5678/webhook-test/` (ou seu endpoint sandbox equivalente).
- Valide esquema com `Set`/`Function` garantindo `vector_name`, `state`, `decision`, `story_id`, `context_snapshot` e `timestamp` antes de prosseguir.
- Gere logs separados por estado (S2, S3, S4) e dispare alertas (Slack/Email) sempre que o filamento decidir `AJUSTAR` ou `BLOQUEAR`.
- Opcional: configure um nó HTTP/Function dentro do workflow para chamar a LLM desejada assim que uma decisão S4 ou AJUSTAR exigir enriquecimento, garantindo que o n8n gerencie a janela de observabilidade.
- Responda ao sistema com `Response Mode` configurado para `Last Node` para confirmar recepção do payload.

### 4️⃣ Executar Testes de Fluxo
- Dispare matrículas representando três cenários: fluxo normal (ACEITAR completo), bloqueio (coorte cheia ou usuário inválido) e ajuste (redistribuição de coorte/horário).
- Verifique que cada estado S1a → S4 foi registrado no caminho dimensional com o `FilamentAuditEntry` correto e que o filamento avaliou `identidade`, `contexto` e `risco`.
- Confirme que os webhooks do n8n receberam e persistiram os payloads correspondentes, mantendo observabilidade e alertas.
- Revise os nós extras do workflow (LLM, dashboards) para garantir que os callbacks internos foram disparados quando exigido.

### 5️⃣ Output Dimensional Esperado
Para cada cenário, gere um relatório auditável que segue o contrato abaixo. O JSON deve conter a trilha completa de estados e evidenciar hooks e validações:

```json
{
	"event_vector": "CourseEnrollment#USER123#COURSE456",
	"story_id": "BACK-101",
	"states": [
		{"state": "S1a", "filament": "ACEITAR", "reason": "Identidade confirmada", "timestamp": "..."},
		{"state": "S1b", "filament": "ACEITAR", "reason": "Contexto carregado", "timestamp": "..."},
		{"state": "S2", "filament": "ACEITAR/AJUSTAR/BLOQUEAR", "reason": "Avaliação de risco", "timestamp": "..."},
		{"state": "S3", "filament": "ACEITAR", "reason": "Persistido na sandbox", "timestamp": "..."},
		{"state": "S4", "filament": "ACEITAR", "reason": "Learning checkpoint", "timestamp": "..."}
	],
	"audit_logs_present": true,
	"hooks_triggered": true,
	"validation_status": "PASS"
}
```

Registre o timer de cada evento (S2/S3/S4) no dashboard n8n para garantir auditabilidade e reprodutibilidade.

## Orientação de criação do fluxo no n8n

1. **Webhook Trigger**
	- Crie um novo workflow e adicione o nó `Webhook` com método `POST`.
	- Cole a URL de teste `http://72.61.216.70:5678/webhook-test/d270c3a9-2937-4c3f-9d81-a3726dabb9a1` como endpoint público.
	- Defina o cabeçalho `Content-Type: application/json` e habilite `Response Mode` para `Last Node`.
2. **Processamento dos dados**
	- Encaminhe para um nó `Set` ou `Function` que valide a presença das chaves `vector_name`, `state`, `decision`, `story_id`, `context_snapshot` e `timestamp`.
	- Opcional: grave cada payload em uma base externa ou envie uma notificação (Slack/Email) sempre que `decision` for `BLOQUEAR` ou `AJUSTAR`.
3. **Observador dimensional**
	- A cada payload (S2/S3/S4) registre o estado, decisão e `reason` em um log ou dashboard de análises.
	- Dispare um nó `HTTP Request` sob demanda para enviar feedback ao sistema (ex.: atualizar plano de ação ou marcar S4 como concluído).
4. **Execução do fluxo**
	- Salve e ative o workflow para tornar o webhook visível.
	- Use o fluxo de enrolamento descrito acima; a cada mudança de estado um POST será recebido.

## Dados esperados pelo webhook n8n
- `vector_name`: nome do evento (`CourseEnrollment`).
- `module`: rota/função que gerou o evento.
- `story_id`: ticket real (por exemplo `BACKLOG-1234`).
- `state`: `S2`, `S3` ou `S4` para as diferentes fases.
- `decision`: `ACEITAR`, `AJUSTAR` ou `BLOQUEAR`.
- `reason`: texto explicando a decisão.
- `timestamp`: ISO 8601 UTC do evento.
- `context_snapshot`: objeto com `dimensions` (identidade, contexto, dependência, risco) e `payload` (dados originais).

Com isso o webhook no n8n funciona como observador dimensional completo. Sempre que um POST chegar, registre o payload para auditorias e use os dados para alimentar regras de monitoramento e alertas no painel.