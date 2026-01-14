# Arquitetura - Synapse

## Visão Geral
Synapse é uma plataforma self-hosted projetada para hospedar cursos técnicos e um Sistema Cognitivo de Avaliação (CAE) que utiliza LLMs para avaliar a compreensão do aluno por meio de interações adaptativas.

Componentes principais:
- Django + DRF (Backend API)
- PostgreSQL (Banco de dados)
- Redis + Celery (Filas e tarefas assíncronas)
- n8n (Orquestração de mídia) 
- Faster-Whisper (Transcrição)
- FFmpeg REST service (Renderização / edição)
- Local LLM runtime ou provider API (Razonamento do CAE)
- MinIO (S3-compatible storage) — opcional
- Nginx (Reverse proxy / TLS)

## Fluxo de Dados (End-to-end)
1. Usuário faz upload do vídeo via FileBrowser.
2. n8n orquestra pipeline: armazena arquivo, envia para Faster-Whisper.
3. Transcrição segmentada é persistida no DB.
4. n8n envia segmentos para o módulo de IA (Whisper + LLM) para gerar timestamps candidatos a cortes.
5. Módulo de edição (FFmpeg REST) recebe comandos e produz Shorts (9:16).
6. CAE (quando aplicável) inicia sessão de avaliação para a aula.
7. LLM Reasoner conversa com o aluno, gera `CognitiveReport` e atualiza `CognitiveProfile`.

## Comunicação entre serviços
- Internamente via Docker Network (service DNS), comunicação HTTP/HTTPS.
- Mensageria: Redis pub/sub + Celery para jobs de processamento pesado (transcrição, render).
- Armazenamento de arquivos via volumes Docker; sugerido MinIO para escala.

## Escalabilidade
- Separar workers por responsabilidade: `whisper-worker`, `render-worker`, `cognition-worker`.
- Usar Redis para filas e rate limiting.
- Offload de render para máquinas com GPU habilitada (NVENC/VAAPI).

## Observabilidade e Monitoramento
- Expor métricas via Prometheus (Django + Celery + custom metrics).
- Dashboards no Grafana para ingestão, erro de transcrição, latência de render e taxa de convergência do CAE.

## Considerações de Segurança e Privacidade
- Criptografia em trânsito (HTTPS) e em repouso (S3 server-side encryption).
- Redaction e masking em logs de prompts/respostas que contenham PII.
- Política de retenção configurável por curso e por arquivo.

## Diagrama (texto)
```
[FileBrowser] -> [n8n pipeline] -> [Faster-Whisper]
                              -> [Postgres (segments)]
                              -> [FFmpeg REST] -> [Storage]
                              -> [Cognition (LLM)] -> [CognitiveReport]
```
