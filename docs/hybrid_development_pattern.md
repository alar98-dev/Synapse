# Padrão de Desenvolvimento Híbrido: Django + React (Vite) + Templates Server-Rendered

## Visão Geral

Este projeto adota uma arquitetura híbrida para o frontend, combinando **Django Templates Server-Rendered** (para páginas estáticas/legadas) com uma **SPA React** construída com Vite (para funcionalidades dinâmicas). Isso permite coexistência de tecnologias, mantendo compatibilidade com sistemas legados enquanto habilita desenvolvimento moderno para novas features.

### Por que Híbrido?
- **Templates Django**: Rápidos para renderização server-side, SEO-friendly, e ideais para páginas públicas ou estáticas (ex.: landing page, documentação).
- **React SPA**: Interativo, componentizado, ideal para dashboards, formulários complexos e aplicações ricas (ex.: app de aprendizado).
- **Integração**: Ambos consomem a mesma API REST (/api/v1), compartilhando autenticação JWT e sessões.

## Componentes Principais

### 1. Django Templates (Server-Rendered)
**Tecnologia**: Django Template Engine (HTML + Python context).

**Localização**: 
- `templates/` (raiz do projeto)
- `frontend/views/` (templates específicos do frontend)
- `frontend/landing.html`, `frontend/index.html`

**Como é Controlado**:
- **Renderização**: Django processa templates no servidor, injetando dados via context processors (ex.: `request.user`, `settings`).
- **URLs**: Definidas em `synapse_project/urls.py` e apps (ex.: `core/urls.py`).
- **Middleware**: `django.middleware.csrf.CsrfViewMiddleware` para proteção CSRF em forms.
- **Autenticação**: Usa `SessionAuthentication` para templates, permitindo login/logout via forms Django.
- **Desenvolvimento**:
  - Edite templates em `frontend/views/` ou `templates/`.
  - Use `{% load static %}` para assets estáticos.
  - Execute `python manage.py runserver` para testar renderização.
- **Build/Deploy**: Templates são servidos diretamente pelo Django; nenhum build necessário.

**Exemplo de Controle**:
```python
# synapse_project/urls.py
path('', TemplateView.as_view(template_name='frontend/landing.html'), name='landing'),
```

### 2. React SPA (Vite)
**Tecnologia**: React 18 + Vite (bundler/build tool) + TypeScript.

**Localização**:
- `frontend/` (pasta raiz do projeto React)
- `frontend/src/` (código fonte)
- `frontend/package.json` (dependências)
- `frontend/vite.config.mjs` (config Vite)

**Como é Controlado**:
- **Bundling**: Vite gerencia o build, otimizando para desenvolvimento (HMR) e produção (minificação).
- **Roteamento**: Usa React Router para rotas SPA (ex.: `/app/dashboard`).
- **API**: Consome `/api/v1` via Axios/Fetch, com JWT em `Authorization: Bearer <token>`.
- **Autenticação**: Tokens JWT armazenados em `localStorage` (ou `sessionStorage` para sessões curtas); refresh automático.
- **Desenvolvimento**:
  - Execute `python frontend.py` (script custom) para iniciar dev server (detecta pnpm/yarn/npm, builda e serve em 0.0.0.0).
  - Edite código em `frontend/src/`.
  - Vite suporta HMR (hot module replacement) para reload instantâneo.
- **Build/Deploy**:
  - `npm run build` gera assets em `frontend/dist/`.
  - Django serve via `STATICFILES_DIRS = [BASE_DIR / 'frontend' / 'dist']` e `STATIC_URL = '/static/'`.
  - Em produção, assets são servidos pelo WhiteNoise ou CDN.

**Exemplo de Controle**:
```javascript
// frontend/vite.config.mjs
export default defineConfig({
  build: { outDir: 'dist' },
  server: { host: '0.0.0.0' }
});
```

### 3. Integração e Controle Geral
**API Compartilhada**:
- Ambos consomem `/api/v1` (DRF + drf-spectacular).
- Autenticação híbrida: Templates usam sessions; SPA usa JWT.

**Controle de Assets**:
- Templates: `{% static 'path' %}` para assets Django.
- SPA: Vite gera hashes únicos; Django serve via static files.

**Desenvolvimento Híbrido**:
- **Backend**: `python manage.py runserver` (porta 8000).
- **Frontend SPA**: `python frontend.py` (porta 5173 por padrão, via Vite).
- **Full Stack**: Use Docker Compose para orquestrar (web + worker + redis).

**Separação de Responsabilidades**:
- Django: Lógica server-side, templates, API.
- Vite/React: UI dinâmica, client-side logic.
- Controle: Edite separadamente; integre via API e static serving.

## Fluxo de Desenvolvimento

1. **Para Templates Django**:
   - Edite HTML em `templates/` ou `frontend/views/`.
   - Teste com `runserver`.

2. **Para React SPA**:
   - Edite JS/TS em `frontend/src/`.
   - Execute `frontend.py` para dev server.
   - Build com `npm run build` e copie para `dist/`.

3. **Integração**:
   - Certifique-se de que rotas não colidam (templates em `/`, SPA em `/app/*`).
   - Use CORS para SPA consumir API.

## Vantagens e Desvantagens

**Vantagens**:
- Flexibilidade: Migre gradualmente de legacy para moderno.
- Performance: Templates server-rendered para SEO; SPA para interatividade.
- Manutenção: Tecnologias isoladas.

**Desvantagens**:
- Complexidade: Duas stacks de frontend.
- Duplicação: Lógica de auth/UI pode se repetir.

## Referências
- [Django Templates](https://docs.djangoproject.com/en/stable/topics/templates/)
- [Vite Guide](https://vitejs.dev/guide/)
- [React Docs](https://react.dev/)</content>
<parameter name="filePath">/srv/SERVER_ORION/hosting/synapse/docs/hybrid_development_pattern.md