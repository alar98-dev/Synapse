# Planejamento — Materiais 🔧

## Resumo do Módulo (padrão)

| Campo | Descrição |
| --- | --- |
| Módulo | Materiais |
| Elementos críticos | Botão "+ Novo material" (dropzone); Upload UX (progress/cancel/retry); MaterialsList; MaterialCard (preview, actions); Filters & Search; Badges |
| Lacuna | API de upload incompleta ou ausente; Ações sem contexto/tooltip; Filtros sem persistência; Feedback fraco durante upload; Rastreabilidade incompleta (sem material_id/correlation_id) |
| Sugestão | Implementar `/api/materials/` CRUD com multipart upload + metadata; UploadModal with progress/cancel/retry; Index search; Badges rules; Emitir S1a/S2/S4 with correlation_id; sampling for progress events (FE/BE/UX/QA) |
| Responsabilidade | Backend / Frontend / UX / QA / Infra |
| Impacto | Aumento de acessos a materiais; redução de atrito no upload; melhor descoberta de conteúdo |
| KPI | Upload success rate; downloads per material; time-to-discovery |
| Prioridade | Alta |
| Telemetria | S1a.material_action: upload_complete/pin/share/download; S2.material_state; S4.material_association; sample progress events (0.1–1%) |

**Resumo:** Planejar e implementar um fluxo robusto e usável para gerenciamento de materiais (upload, associação a aula/atividade, ações rápidas, filtros, badges e telemetria), com atenção a usabilidade, segurança, performance e rastreabilidade de eventos.

> Nota: Todos os eventos emitidos por este módulo devem incluir `correlation_id`. Preencher o campo `Responsabilidade` com nome/alias do owner antes de mover para sprint.

---

## 🔎 Objetivo
Criar uma experiência clara, rápida e auditável para autores e alunos, reduzindo o atrito de upload e descoberta de materiais e aumentando a visibilidade e engajamento com conteúdos relevantes.

---

## 1) Elementos críticos (visão de produto) ✅
- **Botão** "+ Novo material" (modal com dropzone e opção de meta antes do envio)
- **Upload UX**: progresso (percentual), estimativa de tempo, cancelamento, retry automático para falhas transitórias
- **Lista de materiais** (`MaterialsList`) com paginação/infinite scroll, ordenação e persistência de filtros
- **Card de material** (`MaterialCard`): título, preview/thumbnail, meta (tipo/tamanho/autoria), actions (pin/share/download/rename/delete), tooltips e menu de ações
- **Filtros & Busca**: por título, tipo, data, autor, visibilidade, aula/atividade; filtros combináveis e estado persistente (localStorage)
- **Badges**: "Novo", "Atualizado", "Destaque", "Fixado" com regras claras de expiração
- **Mensagens de status/erro**: upload em progresso, processamento servidor, sucesso, falha com retries e ações corretivas claras
- **Skeletons / spinners** durante carregamento e processamento
- **Navegação contextual**: breadcrumbs (Curso → Aula → Materiais) ou nav lateral para contexto
- **Telemetria**: hooks em todas as ações críticas com payloads padronizados (S1a / S2 / S4)

---

## 2) Diagnóstico de lacunas (problemas a priorizar) ⚠️
- **API/endpoint ausente ou incompleto** para upload com metadados e associação (lesson_id/course_id)
- **Ações sem contexto**: botões desabilitados sem tooltip ou sem justificativa (ex.: permissão)
- **Filtros fracos / sem persistência**: não mantém estado entre visitas; busca não indexada → latência e resultados imprecisos
- **Feedback fraco durante upload/processamento**: falta de barra de progresso, mensagens genéricas de erro, sem retry/cancel
- **Badges ambíguos**: regras não documentadas e sem expiração automática
- **Rastreabilidade incompleta**: eventos sem material_id, user_id, lesson_id, file_type, file_size, duration, error_code, correlation_id
- **Limites e validações não claros**: falta verificação MIME, limites de tamanhos por tipo e tratamento para arquivos grandes (chunked)

---

## 3) Sugestões de melhoria (resumo) 💡
- **API RESTful `/api/materials/`** com CRUD e upload multipart + metadata
- **Model `Material`** com campos essenciais (`id`, `title`, `file_key`, `file_type`, `file_size`, `uploader_id`, `lesson_id`, `visibility`, `pinned`, `featured`, `status`, `created_at`, `updated_at`, `metadata`)
- **Validações**: tipos permitidos (pdf/docx/pptx/mp4/jpg/png/zip), checagem MIME, limites padrão (ex.: 100MB), recomendações UX (10MB ideal), virus-scan hook
- **UI**: `MaterialsList`, `MaterialCard`, `UploadModal/Dropzone` com preview, meta e validação antes do envio
- **UX**: mostrar % progresso + estimate, cancel/retry, confirmação/undo para ações destrutivas
- **Filtros**: backend indexado (Postgres GIN/Full-text ou Elasticsearch); debounce no frontend; persistência local
- **Badges & regras**: "Novo" (≤48h), "Atualizado" (alterado ≤7d), "Destaque" (manual), "Fixado" (por usuário/contexto)
- **Telemetria**: S1a/S2/S4 com payloads padronizados e correlation_id para rastreamento end-to-end

---

## 4) Plano de implementação (passos práticos) 📋
### Backend (entregáveis)
1. **Modelo e migrations** para `Material` (incl. índices para busca por title, tags e lesson_id)
2. **Endpoints REST**:
   - **POST** `/api/materials/` – upload (multipart) + metadata
   - **GET** `/api/materials/` – list + filtros + paginação
   - **GET** `/api/materials/{id}/` – detail + preview URL (signed)
   - **PATCH** `/api/materials/{id}/` – editar título/visibility/tags/destaque
   - **POST** `/api/materials/{id}/pin/` – pin/unpin (user-scoped)
   - **POST** `/api/materials/{id}/share/` – gerar link curto ou registrar evento de share
   - **DELETE** `/api/materials/{id}/`
3. **Upload flow**: multipart → validate → save to storage (S3 or FS) → async processing (thumbnail, transcode) → update status
4. **Chunked/resumable uploads** (opcional para arquivos grandes)
5. **Autorização**: permissões por role (teacher/student/admin) e por lesson/course ownership
6. **Observability**: emitir eventos de telemetria nas fases (upload_start/upload_complete/processing_success/processing_fail)

### Frontend (entregáveis)
1. **UploadModal/Dropzone** com validação pré-envio, preview e campos de metadata
2. **MaterialsList**: filtros, ordenação, persistência de estado e paginação/infinite scroll
3. **MaterialCard**: actions (pin/share/download/rename/delete), badges, tooltips e confirmação/undo
4. **Indicadores de estado**: progress bars, skeletons, mensagens de erro com CTA de retry

### QA & testes
- Testes unitários e de integração para endpoints e upload
- E2E (Cypress / Playwright) para fluxo de upload → associar → pin/share → download
- Testes de carga para listagem (responder em ≤300ms com cache/index)
- Testes de rede: simular quedas e validação de retry/cancel

---

## 5) Critérios de aceitação / validação ✅
- Upload concluído em ≤10s para arquivos <10MB em conexão padrão (lab)
- Listagem com filtros comuns responde em ≤300ms em condições cacheadas/indexadas
- Badges exibidas corretamente conforme regras e atualizam dinamicamente
- Ações (pin/share/download) executam e emitem evento **S1a.material_action** com payload completo
- Skeleton/spinner visível durante upload/processing
- Erros com mensagens específicas e opções de retry/cancel

---

## 6) Telemetria sugerida (detalhada) 📡
Importante: padronizar nomes, tipos e evitar PII. Incluir `correlation_id` para rastreabilidade end-to-end.

### Eventos principais
- **S1a.material_action** (ação do usuário)
  - Quando: upload complete, pin/unpin, share, download, delete
  - Campos obrigatórios: `event`, `material_id`, `user_id`, `action`, `lesson_id?`, `course_id?`, `file_type`, `file_size`, `duration_ms?`, `success`, `error_code?`, `correlation_id`
  - Exemplo payload:

```json
{
  "event": "S1a.material_action",
  "material_id": "m_123",
  "user_id": "u_456",
  "action": "upload",
  "file_type": "pdf",
  "file_size": 345678,
  "duration_ms": 2400,
  "success": true,
  "correlation_id": "c_789"
}
```

- **S2.material_state** (mudança de estado)
  - Quando: pin/unpin, featured toggle, visibility change
  - Campos: `event`, `material_id`, `user_id`, `new_state`, `previous_state`, `timestamp`, `correlation_id`

- **S4.material_association** (associação/desassociação)
  - Quando: associar/desassociar a lesson/activity
  - Campos: `event`, `material_id`, `user_id`, `lesson_id`, `course_id`, `association_type` (attach/detach), `timestamp`, `correlation_id`

**Observações**
- Progress updates (alta cardinalidade) devem ser sampleados (ex.: 0.1% ou 1% dependendo do volume)
- Garantir não enviar conteúdo do arquivo (PII/PHI)

---

## 7) QA checklist & Tickets sugeridos 🧾
- FEAT: API `/materials/` — CRUD + upload (incl. validation + virus scan)
- FEAT: UI — `MaterialsList`, `UploadModal`, `MaterialCard`, filtros persistentes
- ENH: Ações rápidas com tooltip/undo (pin/share/download/rename/delete)
- ENH: Badges rules & UX microcopy
- CHORE: Telemetry S1a/S2/S4 + dashboards (upload success, latency, top file types)
- TEST: Integration/E2E tests for upload/processing/retry/resume

---

## 8) Critérios de priorização & rollout 🚦
- **MVP (Alta prioridade)**: POST `/api/materials/` (multipart upload + metadata), GET list, basic download, progress UI, S1a event on upload
- **Fase 2 (Média prioridade)**: pin/feature, share links, badges auto (novo/updated), persistence de filtros, search index
- **Fase 3 (Baixa prioridade)**: resumable uploads, advanced search analytics, dashboards completos

---

## 9) Impacto esperado nos KPIs 📈
- Aumento de acessos a materiais por aluno (diminuição de atrito no upload)
- Aumento de engajamento em aulas com materiais destacados/fixados
- Redução do tempo médio de descoberta de materiais (melhor busca/filtragem)
- Melhoria na rastreabilidade para análises de retenção e uso

---

## Anexo — Regras de badges (detalhadas)
- **Novo**: created_at <= 48h
- **Atualizado**: updated_at > created_at && updated_at <= 7d
- **Destaque**: flag `featured` (manual, curator-driven)
- **Fixado**: flag `pinned` por usuário no contexto da aula (persistente)

---

## Exemplo de uso — Upload (cURL)
```
curl -X POST "https://example.com/api/materials/" \
  -H "Authorization: Bearer <token>" \
  -F "title=Slides - Aula 1" \
  -F "lesson_id=lesson_123" \
  -F "visibility=private" \
  -F "file=@slides.pdf"
```

Resposta (201):
```json
{
  "material_id": "m_123",
  "upload_status": "processing",
  "preview_url": "https://.../signed-url"
}
```

---

## 🔧 Implementação — snippets e recomendações rápidas
A seguir há exemplos concisos de como podemos implementar o backend em Django + DRF, práticas de segurança, telemetria e tickets técnicos para dividir o trabalho.

### Modelo (exemplo Django)
```python
import uuid
from django.db import models
from django.conf import settings

class Material(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    file_key = models.CharField(max_length=1024)  # chave no storage (S3/FS)
    file_type = models.CharField(max_length=64)
    file_size = models.BigIntegerField()
    uploader = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    lesson = models.ForeignKey('courses.Lesson', on_delete=models.CASCADE, null=True, blank=True, related_name='materials')
    visibility = models.CharField(max_length=20, default='private')
    pinned = models.BooleanField(default=False)
    featured = models.BooleanField(default=False)
    status = models.CharField(max_length=20, default='processing')  # processing/ready/failed
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=['lesson']),]
```

> Observação: adicionar índices de texto (GIN / tsvector) para `title` e `tags` quando for necessário suporte a full-text.

### Serializers / ViewSet (DRF sketch)
- Use `ModelSerializer` e um `ModelViewSet` com `create` customizado para receber multipart/form-data.
- Na criação: validar mime/size → persistir metadados + salvar arquivo no storage (ou gerar signed URL e permitir upload direto) → enfileirar processamento (thumbnail/transcode/virus-scan) → retornar status 201 com `upload_status: processing`.

### Upload resumível / arquivos grandes
- Recomendado: suportar S3 multipart + pre-signed URLs ou protocolo `tus` para uploads resumíveis.
- Para uploads diretos: emitir `upload_start`, usar `signed_url` com TTL (ex.: 1h) e validar `content-type` no backend antes de marcar `ready`.

### Segurança & compliance 🔒
- Verificar MIME e extensão no servidor; rejeitar arquivos não permitidos.
- Limites por tipo (ex.: 100MB para vídeos, 20MB para slides) com mensagens claras no FE.
- Virus scan (hook síncrono/assíncrono) antes de marcar `ready`.
- Signed URLs com TTL curto; armazenar `file_key` sem expor caminhos internos.
- Criptografia em repouso (S3 SSE) e acessos via roles/credentials.

### Telemetria ampliada (exemplos)
- `S1a.upload_start` — quando o cliente inicia o upload
```json
{ "event": "S1a.upload_start", "user_id": "u_1", "correlation_id": "c_1", "file_type": "pdf", "file_size": 12345 }
```
- `S1a.upload_progress` — sampleado (0.5% por padrão)
```json
{ "event": "S1a.upload_progress", "material_id": null, "user_id": "u_1", "progress": 42, "correlation_id": "c_1" }
```
- `S1a.upload_complete` / `S1a.processing_fail` — sucesso/falha com `error_code`

> Regras de amostragem e retenção devem ser definidas para evitar alta cardinalidade (ex.: sample 0.5% progress events, 100% events para upload_complete/processing_fail).

### Critérios de aceitação (detalhados)
- 95th percentile do tempo de listagem com filtros <= 300ms (cache/indexado). ✅
- Upload de arquivo <10MB conclui em <=10s em conexão lab padrão; erros <=1% em condições normais. ✅
- Telemetria: `S1a.upload_complete` e `S1a.material_action` emitidos em 100% dos casos; `progress` sampleado. ✅
- Testes E2E cobrindo upload → processamento → associar a lesson → download → pin/unpin. ✅

### Tickets técnicos sugeridos (exemplos)
- FEAT: Backend `Material` model + migrations + basic CRUD endpoints (3d)
- FEAT: POST `/api/materials/` (multipart) → storage + background processing (4d)
- ENH: Upload resumível (tus/S3 multipart) + tests (3d)
- FEAT: Frontend UploadModal + progress + cancel/retry (3d)
- CHORE: Telemetria S1a/S2/S4 + dashboards e alertas (2d)
- TEST: E2E + load test + security tests (3d)

---
