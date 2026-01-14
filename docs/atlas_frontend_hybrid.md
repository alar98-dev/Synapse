# ATLAS — Frontend Híbrido (Django + React/Vite)

## Visão Geral

Este documento descreve o estado atual e as práticas recomendadas para o desenvolvimento do frontend híbrido do projeto ATLAS. A arquitetura combina páginas server-rendered com Django Templates para conteúdo público/estático e uma SPA React (Vite + TypeScript) para o dashboard e partes altamente interativas.

Objetivos do documento:
- Mapear estrutura do repositório relacionada ao frontend
- Documentar o fluxo de desenvolvimento local e produção
- Apresentar práticas de integração, segurança, build e deploy
- Fornecer comandos, exemplos e recomendações para CI/CD

---

## Mapeamento do Repositório (onde olhar)

- Frontend da SPA: `frontend/` — código React + Vite, `frontend/src/`, `vite.config.*`, `package.json`.
- Templates e views server-rendered: `templates/` e `frontend/views/` (templates específicos).
- Script auxiliar: `frontend.py` — script custom para detectar pnpm/yarn/npm e iniciar o dev server/builder.
- Configurações Django: `synapse_project/settings.py` — verificar `STATIC_URL`, `STATICFILES_DIRS`, `STATIC_ROOT`.
- URLs que roteiam para SPA: `synapse_project/urls.py` e apps (ex.: `core/urls.py`) — procurar `re_path(r'^app/.*', ...)`.
- Docs e guias: `docs/` — há um documento base `hybrid_development_pattern.md` usado como referência.

---

## Arquitetura e Integração

1. Páginas públicas e marketing (landing pages, docs) são servidas por Django Templates — SEO-friendly e simples.
2. A SPA React cadastra-se em uma rota prefixada (ex.: `/app/*`) e monta-se em um template Django simples (`app.html`).
3. O build do Vite produz artefatos estáticos (CSS/JS/imagens) que são colocados em um diretório servido por Django (ex.: `frontend/dist/` ou `backend/static/frontend/`).
4. Autenticação híbrida: Templates usam sessão/cookies; SPA usa JWT (ou cookies com token csrf + session) dependendo da configuração do backend.

Comunicação API:
- A SPA consome `/api/v1/*` (DRF). Durante desenvolvimento, o Vite dev server faz proxy para `http://localhost:8000`.
- Configurar CORS no backend para permitir o dev server e domínios de produção.

---

## Fluxo de Desenvolvimento Local

Recomendações rápidas:

1. Rodar backend Django:

```bash
python manage.py runserver
```

2. Rodar frontend (dev):

```bash
# dentro de frontend/
python ../frontend.py    # ou npm run dev / pnpm run dev conforme setup
```

Observações:
- `frontend.py` detecta o gerenciador de pacotes (pnpm/yarn/npm) e facilita o comando de dev.
- O Vite server por padrão roda em `5173` e faz proxy para `/api` apontando para Django; assim o SPA pode consumir a API sem CORS em dev.

Hot Module Replacement (HMR) está disponível para acelerar iterações de UI.

---

## Build e Deploy (Produção)

1. Build do frontend:

```bash
# dentro de frontend/
npm run build    # gera dist/ conforme vite.config
```

2. Coletar estáticos no Django:

```bash
python manage.py collectstatic --noinput
```

3. Servir estáticos via Nginx/Apache (recomendado) ou WhiteNoise para deployments simples.

Configuração típica no `settings.py`:

```python
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
    BASE_DIR / 'frontend' / 'dist',  # artefatos do Vite
]
```

Recomendações de produção:
- Use gzip/brotli no servidor web
- Configure long-term caching para arquivos com hash
- Use um CDN para assets grandes ou de alto tráfego

---

## Rotas Híbridas e Templates

- Rota raiz (`/`) e páginas públicas: Django TemplateView.
- SPA: inclua uma rota catch-all para `/app/*` que retorna `app.html` com um `div#root` onde o React monta-se.

Exemplo de URLs:

```python
from django.urls import path, re_path
from django.views.generic import TemplateView

urlpatterns = [
    path('', TemplateView.as_view(template_name='landing.html'), name='landing'),
    re_path(r'^app/.*', TemplateView.as_view(template_name='app.html'), name='app'),
]
```

No template `app.html`, referencie os assets gerados pelo Vite usando as tags estáticas do Django.

---

## Autenticação e Segurança

- Páginas server-rendered continuam a usar sessões Django + CSRF.
- SPA deve usar JWT em `Authorization: Bearer <token>` ou cookies seguros (HttpOnly, SameSite) dependendo do risco e do fluxo de refresh.
- Configure CSP (Content Security Policy) para permitir os hosts e hashes necessários; minimize `unsafe-inline`.
- Habilite SRI (Subresource Integrity) para scripts críticos, quando aplicável.

Regras práticas:
- Não exponha chaves secretas no frontend.
- Use HTTPS em produção e marque cookies como `Secure`.

---

## Testes e Qualidade

- Testes de integração: teste endpoints REST consumidos pela SPA.
- Testes de UI: considerar testes end-to-end com Playwright ou Cypress apontando para o dev server integrado.
- Linting e formatação: habilitar ESLint/Prettier no `frontend/` e flake8/black para Python.

---

## CI/CD — Sugestão (GitHub Actions)

- Pipeline básico:
  1. Checkout
  2. Instalar dependências backend (pip install -r requirements.txt)
  3. Executar testes Python
  4. Build frontend (`npm ci && npm run build`) dentro de `frontend/`
  5. Run `collectstatic` e preparar artefatos
  6. Build/push da imagem Docker (ou deploy via rsync)

Obs: Em setups com Docker Compose, buildar a imagem que já contém os assets estáticos ou usar um passo separado para sincronizar `frontend/dist` para o container estático.

---

## Problemas Comuns e Soluções Rápidas

- Vite HMR não conecta: verifique `server.host` e `server.hmr` no `vite.config` e se o proxy está configurado.
- Assets não encontrados após deploy: confirme `STATICFILES_DIRS` e que `collectstatic` incluiu `frontend/dist`.
- CORS em produção: habilitar `django-cors-headers` e configurar `CORS_ALLOWED_ORIGINS`.

---

## Boas Práticas e Recomendações

- Manter a SPA isolada em `frontend/` com sua própria pipeline de build.
- Versionar as dependências do frontend (`package-lock.json` / `pnpm-lock.yaml`).
- Evitar lógica de autorização duplicada: centralizar regras no backend e expor pequenas flags via API quando necessário.
- Documentar claramente o contrato da API (`/api/v1`) e usar testes de contrato se possível.

---

## Próximos Passos Prioritários

1. Confirmar onde o Vite está outputando os assets no repositório atual (`frontend/dist` ou `backend/static/frontend`) e ajustar `STATICFILES_DIRS`.
2. Adicionar um workflow de CI que execute `npm ci && npm run build` e `python manage.py collectstatic` antes do deploy.
3. Padronizar autenticação (cookies vs JWT) para reduzir duplicação.
4. Criar um template de Nginx para servir estáticos do `STATIC_ROOT` e proxiar `/api` para o app Gunicorn.

---

Se quiser, eu posso:
- Rodar comandos de verificação no repositório (listar `frontend/` e `synapse_project/settings.py`).
- Criar um `workflow` de GitHub Actions inicial para CI/CD.
- Ajustar `hybrid_development_pattern.md` integrando estes detalhes.

Arquivo criado: `docs/atlas_frontend_hybrid.md`
