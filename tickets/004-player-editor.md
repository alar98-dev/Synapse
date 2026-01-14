# Feature: Player + Editor (Split View)

**Módulo:** player / sandbox / frontend
**Prioridade:** Alta
**Labels:** frontend, ui, sandbox, high

## Objetivo
Implementar a tela `Player + Editor` (split view) que permite assistir à aula com transcrição sincronizada e editar/executar código no mesmo contexto.

## Descrição técnica
- Video player com suporte VTT (timestamps) e API para buscar segmentos transcritos.
- Monaco editor embutido com botões `Run`/`Submit` e painel de saída/terminal.
- Comunicação em tempo real com sandbox via WebSocket para estado do runner, logs e progress.
- Emissão de eventos: `video_play`, `transcript_seek`, `run_clicked`, `submission_s1a`.

## Checklist de implementação
- [ ] Player component com VTT sync
- [ ] Monaco editor + file explorer minimal
- [ ] WebSocket client para sandbox session state
- [ ] UI para mostrar result_summary e permitir re-submission
- [ ] Instrumentar telemetria (S1a on submit)
- [ ] E2E smoke: abrir aula -> executar código -> submeter

## Dependências
- `materials` APIs (video URL, transcript VTT)
- `sandbox` APIs + WebSocket endpoints
- Telemetry ingest endpoint

## Critérios de aceite
- Player e editor carregam em < 2s TTI (em staging)
- Execução `Run` mostra logs em tempo real no terminal
- `Submeter` dispara evento S1a e cria Submission no backend

## Notas
## Notas
- É proibido o uso de mocks/fallbacks em entregas ou validações de aceitação; o frontend deve integrar-se ao `sandbox` real e aos endpoints WebSocket em `staging` antes de qualquer rollout.
- Priorizar disponibilidade do `sandbox` e contratos API (OpenAPI) e planejar ambientes de teste integrados (staging) com dados e runner reais para validação end-to-end.
 - Priorizar UX de loading e retry para conexões WebSocket instáveis.
