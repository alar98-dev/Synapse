# 📊 RELATÓRIO DE UX/UI E IMPLEMENTAÇÃO: PROJETO SYNAPSE

**Data:** 13 de Janeiro de 2026  
**Responsável:** GitHub Copilot (Senior UX Lead / AI Specialist)  
**Status do Projeto:** MVP em Hardening

---

## 🔹 1. Resumo Executivo
O sistema **Synapse** apresenta uma casca visual extremamente sofisticada e atraente, adotando uma estética "Enterprise Dark" de alta qualidade. No entanto, há um descompasso crítico entre a maturidade visual (UI) e a maturação funcional (Backend-Frontend integration). Atualmente, o sistema se comporta mais como um **protótipo de alta fidelidade** do que como um produto funcional, pois a vasta maioria das interações utiliza dados estáticos (hardcoded) em vez de consumir a API Django disponível.

## 🔹 2. Avaliação Geral de UX: `REGULAR`
- **UI:** Excelente (Moderna, consistente e imersiva).
- **UX:** Regular (Fluxos interrompidos por falta de dados reais e estados de erro/vazio não tratados).
- **Funcionalidade:** Ruim (Apenas Autenticação está 100% dinâmica).

## 🔹 3. Mapa de Páginas e Status

| Página | Rota | Status | Observação |
| :--- | :--- | :--- | :--- |
| **Login / Auth** | `/auth` | ✅ Completa | Autenticação JWT e integração com `/me` funcionando. |
| **Dashboard** | `/` | 🟡 Parcial | UI implementada, mas dados (stats, charts) são estáticos. |
| **Catálogo** | `/catalog` | ❌ Placeholder | Rota existe no router, mas o arquivo `.html` não existe. |
| **Classroom** | `/classroom` | 🟡 Parcial | Navegação lateral estática; sem Player real ou AI Tutor funcional. |
| **Cursos** | `/courses` | 🟡 Parcial | Listagem hardcoded no JS; botões de ação são apenas "stubs". |
| **AI Center** | `/ai-center` | 🟡 Parcial | Visual excelente, mas puramente ilustrativo (mocked). |
| **Course Builder** | `/builder` | 🔹 Incompleta | Estrutura básica sem lógica de persistência. |
| **Perfil** | `/profile` | ❌ Placeholder | Não implementado (404/Erro no carregamento). |

## 🔹 4. Páginas Sem Implementação Real
- **Catalog & My Learning:** As views `catalog.html` e `my_learning.html` estão ausentes no diretório `frontend/views/`, causando quebras de navegação.
- **Analytics & Finance:** Telas críticas para o nível "Enterprise" mencionadas no `protected_features.js` não possuem arquivos correspondentes.
- **Profile:** Essencial para gestão de conta, atualmente inexistente.

## 🔹 5. Páginas com Funcionalidade Insuficiente
- **Dashboard Principal:** Exibe métricas impressionantes (1.284 alunos, 84% completion), mas os dados não refletem o banco de dados. Os efeitos 3D nos cards são cosméticos, mas não há "drill-down" funcional.
- **Classroom:** A árvore de currículo é gerada por um array fixo no `classroom.js`. Não é possível navegar por um curso real vindo do banco de dados.
- **AI Center:** A interface de terminal e os seletores de modelo não enviam comandos reais para o `cognition/engine.py`.

## 🔹 6. Conteúdos Duplicados ou Redundantes
- **Views AI:** Existem `ai_center.html` e `aicenter.html` no diretório de views. O sistema utiliza `ai_center.html`, tornando o outro arquivo obsoleto e confuso para manutenção.
- **Componentes CSS:** Há uma sobreposição de estilos entre `base.css`, `components.css` e estilos `inline` dentro de views (como no `ai_center.html`), o que dificulta a escalabilidade do tema.

## 🔹 7. Inconsistências Visuais e Técnicas
- **Bibliotecas de Ícones:** O `index.html` carrega **Boxicons**, mas a view de `AI Center` utiliza classes `ri-` (**Remix Icon**), resultando em ícones invisíveis se a lib não for carregada.
- **Feedbacks de Ação:** Muitos botões utilizam `alert()` ou `Toast.show({message: 'Stub'})`, o que quebra a imersão de um sistema enterprise.
- **Arquitetura Híbrida Confusa:** Existe uma estrutura React em `frontend/src/` que não está sendo utilizada pelo `index.html` principal (que foca em Vanilla JS). Isso indica uma possível indecisão arquitetural.

## 🔹 8. Problemas de Fluxo e Usabilidade
- **Caminhos Sem Saída:** Tentar acessar `/catalog` ou `/profile` resulta em um container de erro que, embora bem estilizado, interrompe a jornada do usuário.
- **Breadcrumbs:** O componente de breadcrumb no `state.js` é simples demais e não lida com navegação profunda ou parâmetros de URL (IDs de curso).

---

## 🚀 9. Recomendações de UX Prioritizadas

### 🔴 Curto Prazo (Imediato - "Functional Quick Wins")
1.  **Dinamização da Listagem:** Substituir os mocks de `courses.js` por chamadas `fetch` ao endpoint `/api/v1/courses/`.
2.  **Correção de Dependências:** Padronizar todos os ícones para **Boxicons** ou incluir a CDN do **Remix Icon** no `index.html`.
3.  **Criação de Fallbacks:** Adicionar a view de `profile.html` (mesmo que mínima) para evitar o erro de "Módulo em Desenvolvimento".

### 🟡 Médio Prazo (Próximas Sprints)
1.  **Integração do Classroom:** Conectar a `curriculum-tree` aos modelos `Problem` e `Submission` do backend.
2.  **Centralização de Estilos:** Mover os blocos `<style>` internos das views para o `views.css` ou `components.css`.
3.  **Real Dashboard:** Implementar um endpoint no Django para agregar métricas reais e alimentar os cards do Dashboard.

### 🟢 Longo Prazo (Escalabilidade)
1.  **Decisão de Framework:** Consolidar a interface. Se a intenção é usar **React** (visto em `src/`), migrar a SPA Vanilla para os componentes React já iniciados. Se for Vanilla, remover a pasta `src/` para reduzir o ruído.
2.  **Isolamento do Sandbox:** Implementar o "Hardening" do executor de código (conforme citado no `missing_implementation.md`) para que a UX do professor seja confiável (sem travamentos de containers órfãos).
3.  **RAG Real no AI Center:** Conectar a interface do AI Center ao processamento de documentos real para dar valor prático à aba de "Intelligence".
