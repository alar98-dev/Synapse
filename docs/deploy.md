# Guia de Deploy - Synapse (Docker Compose)

## Objetivo
Garantir que a stack rode de forma isolada, segura e reprodutível usando Docker Compose para desenvolvimento e um guia de produção (Nginx, TLS, sistema de backups).

## Serviços mínimos para desenvolvimento
- `db` (Postgres)
- `redis`
- `web` (Django/Gunicorn)
- `worker` (Celery)
- `n8n` (orquestrador de workflows de mídia)

## Serviços recomendados para produção
- `minio` (S3-compatible storage)
- `whisper` (container do Faster-Whisper)
- `ffmpeg` (REST wrapper para renderização)
- `cognition` (serviço LLM connector / worker)
- `prometheus`, `grafana` (observabilidade)

## Docker Compose (exemplo de extensão)
1. Criar `docker-compose.override.yml` com volumes e variáveis locais.
2. Para produção, criar `docker-compose.prod.yml` sem volumes locais e com `replica` para workers.

## Rede e TLS
- Recomendo usar Nginx como reverse proxy e Let's Encrypt para TLS (certbot). Exemplo de Nginx config incluída em `docs/nginx-example.conf`.

## Healthchecks e limites
- Para cada serviço, configure `healthcheck`, `restart: unless-stopped` e `mem_limit`/`cpus` quando necessário.

## Backups
- Backup do Postgres via `pg_dump` agendado para storage rotativo.
- Backup de arquivos do `media/` para MinIO com ciclo de retenção configurável.

## Checklist antes de subir para produção
- [ ] Secrets gerenciados em sistema seguro (Vault / GCP Secret Manager / envfile criptografado)
- [ ] HTTPS via Let's Encrypt
- [ ] Política de retenção de dados definida
- [ ] Observabilidade configurada (Prometheus/Grafana)
- [ ] Testes E2E aprovados (upload -> transcription -> assessment -> render)
