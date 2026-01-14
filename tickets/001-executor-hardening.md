# Hardening: Replace docker.sock runner

**Módulo:** executor / sandbox
**Prioridade:** Alta
**Labels:** infra, executor, security, high

## Objetivo
Substituir a dependência direta do Docker socket no worker atual por um executor isolado (Kubernetes Job, runner remoto ou serviço RPC) e aplicar limites de recurso e cleanup confiável.

## Descrição técnica
O worker atual cria containers diretamente via Docker SDK usando `/var/run/docker.sock`, o que representa risco de segurança e limita o deploy em ambientes gerenciados. Implementar um executor que receba jobs (via fila ou RPC) e crie execuções isoladas em pods/containers controlados por orquestrador (k8s) ou serviço remoto.

### Entregáveis
- Serviço `executor` que aceita requests para iniciar/cancelar um job (gRPC/HTTP+queue).
- Worker migrado para enviar jobs ao `executor` em vez de usar Docker SDK local.
- Resource limits (CPU, memory) aplicados por job e políticas de timeout/soft limits.
- Mecanismo de cleanup para containers/pods órfãos.
- Testes de integração e carga (smoke + load).

## Checklist de implementação
- [ ] Definir contrato API entre worker e executor (`start_job`, `cancel_job`, `status`)
- [ ] Implementar service `executor` (k8s job controller ou service que cria pods)
- [ ] Atualizar Celery worker para usar o novo contrato (RPC/queue)
- [ ] Adicionar resource requests/limits para jobs
- [ ] Implementar cleanup e retry/backoff
- [ ] Adicionar métricas Prometheus: `job_duration_seconds`, `job_success_total`, `job_fail_total`
- [ ] Testes: unitários, integração e carga leve
- [ ] Documentação operacional (runbook) para escalonamento e troubleshooting

## Dependências
- Kubernetes manifests / cluster availability (staging)
- Redis/Celery (fila)
- Observability infra (Prometheus)

## Critérios de aceite
- Worker não acessa `/var/run/docker.sock` em staging/prod
- >=95% de sucesso em suite de smoke tests (local/staging)
- Metrics aparecem em Grafana; alertas para fail rate > 5%
- Cleanup evita containers/pods órfãos após falhas

## Observações
Priorizar este ticket antes de qualquer rollout para produção; pode ser realizado em 1-2 sprints com foco infra e backend.
