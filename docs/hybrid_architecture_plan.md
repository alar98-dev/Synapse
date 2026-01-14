# 🏗️ PLANO DE ARQUITETURA HÍBRIDA: SYNAPSE

**Data:** 13 de Janeiro de 2026  
**Status:** Definição de Fronteiras Técnicas e Roteamento  
**Responsável:** GitHub Copilot (Sr. Software Architect & Design Lead)

---

## 🔹 1. MAPA DE RESPONSABILIDADE
O princípio fundamental é o **Isolamento de Estado e Domínio**. O sistema será dividido em duas grandes áreas com tecnologias e objetivos distintos.

| Camada | Tecnologia | Contexto de Uso | Responsabilidade Principal |
| :--- | :--- | :--- | :--- |
| **STATIC** | HTML/JS Vanilla | `/` , `/auth` , `/support` | Landing page, SEO, Conversão, Login e Institucional. |
| **SPA** | **React + Vite** | `/app/*` | Dashboard, Classroom, IDE, Gestão e Inteligência Artificial. |

### 🚫 O que é Proibido (Anti-Patterns):
1.  **SPA no Root Index:** O `index.html` da raiz NÃO deve gerenciar o roteamento pesado do Dashboard. Ele deve servir apenas ao marketing e entrada.
2.  **Estado Global Compartilhado:** O `state.js` (Vanilla) não deve ser injetado na aplicação React. A SPA deve usar sua própria gestão (Zustand/Redux/Context).
3.  **HTML Híbrido:** As views dentro de `frontend/views/` não devem tentar carregar componentes React isolados via scripts manuais.

---

## 🔹 2. MAPA DE ROTAS FINAL (Routing Strategy)

O roteamento será controlado pelo **Django** (Backend) para garantir a separação física dos entrypoints e carregamento de assets.

| Rota | Destino | Implementação |
| :--- | :--- | :--- |
| `/` | **Landing Page** | `frontend/index.html` (Static) |
| `/auth` | **Login/Register** | `frontend/views/auth.html` (Static Minimal) |
| `/support` | **Knowledge Base** | `frontend/views/support.html` (Static Content) |
| `/app/dashboard` | **SPA Home** | `frontend/src/main.tsx` (React SPA) |
| `/app/courses/*` | **Course Management**| `frontend/src/main.tsx` (React SPA) |
| `/app/classroom/*`| **Classroom IDE** | `frontend/src/main.tsx` (React SPA) |

> **Implementação Técnica:** Todas as rotas sob o prefixo `/app/` devem ser enviadas pelo Django para o `dist/index.html` gerado pelo Vite.

---

## 🔹 3. REGRAS DE DESENVOLVIMENTO (The Synapse Manifesto)

### ✅ O QUE PODE:
*   **Design Tokens Globais:** Utilizar variáveis CSS de cores e espaçamentos (ex: `base.css`) para garantir que o botão da Landing Page seja igual ao do Dashboard.
*   **API Dinâmica:** A SPA React deve ser a única a realizar operações complexas de escrita e lógica de negócio via REST API.
*   **Redirecionamento Pós-Auth:** O fluxo de autenticação (estático) redireciona o usuário para o domínio da SPA (`/app/dashboard`) após a validação do token.

### ❌ O QUE NÃO PODE:
*   **Vazamento de CSS:** A SPA React não deve importar `sidebar.css` ou `layout.css` do estático. Ela deve possuir seu próprio layout encapsulado.
*   **Manipulação de DOM Cruzada:** Scripts da Landing Page não podem tentar alterar elementos dentro da renderização do React e vice-versa.

---

## 🔹 4. ESTILOS E DESIGN SYSTEM

Para evitar conflitos de especificidade:

1.  **Prefixagem:** Classes do site estático devem usar o prefixo `.syn-pub-`.
2.  **Encapsulamento SPA:** A aplicação React deve utilizar **Tailwind CSS** ou **CSS Modules** para garantir que estilos internos não "vazem" para as páginas de suporte.

---

## 🔹 5. CHECKLIST ANTI-CONFLITO

- [ ] **Configuração Django:** O `urls.py` do projeto sincroniza o prefixo `/app/` com o entrypoint do Vite?
- [ ] **Auth Pipeline:** O `localStorage` gravado pelo Login (Vanilla) é lido corretamente pelo provedor de Auth do React?
- [ ] **Asset Loading:** As fontes e ícones estão sendo carregados de forma centralizada para evitar requisições duplicadas?
- [ ] **Cleanup:** As views duplicadas (ex: `ai_center.html` vs `React View`) foram marcadas para depreciação?

---

## 🚀 PRÓXIMOS PASSOS

1.  **Configurar o Django para `/app/`**: Criar a View que serve o bundle do Vite.
2.  **Portar a Classroom**: Mover a lógica de `classroom.js` para um componente funcional React.
3.  **Centralizar Auth**: Garantir que o `AccessToken` seja validado no `App.tsx` da SPA antes de qualquer renderização.
