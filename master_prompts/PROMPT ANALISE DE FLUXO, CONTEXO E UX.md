Prompt Master Especializado — Análise de Fluxo, Conteúdo e UX

Objetivo do Prompt:

Recuperar o contexto completo do sistema, documentar o que já foi implementado, identificar lacunas e planejar a estrutura de cada página, elemento e sessão com foco em experiência do usuário, fluxos de navegação e conteúdo estratégico, sem gerar front-end. O output será um plano de interface e UX detalhado, incluindo recomendações de usabilidade e prioridade de implementação.

Instruções para a LLM:

Contexto:

Sistema híbrido: Django + React SPA (Vite)

Algumas páginas templates clássicos, outras SPA

Backend com endpoints reais, autenticação JWT, RBAC definido

Documentação OpenAPI e endpoints sensíveis conhecidos

Objetivos da análise:

Mapear páginas existentes e views incompletas

Registrar funcionalidades já implementadas (ex.: login, dashboard, AI center, cursos)

Documentar conteúdo de cada sessão: títulos, menus, cards, formulários, alertas, placeholders, modais

Identificar lacunas de conteúdo e funcionalidades ausentes

Sugerir prioridade estratégica para implementação

Foco na UX e fluxo do usuário:

Descrever como cada elemento deve funcionar dentro do fluxo, considerando perfil do usuário (admin, instrutor, aluno)

Identificar pontos de confusão potencial e melhoria de navegação

Planejar sessões e elementos por página, incluindo agrupamento lógico (cards, listas, detalhes, modais)

Garantir que o usuário perceba coerência visual e hierarquia de informações

Formato de saída esperado:
Para cada página / view:

Nome da página / rota

Objetivo principal

Elementos previstos (sessões, cards, menus, formulários)

Funcionalidades implementadas / incompletas

Fluxo ideal do usuário (passo a passo)

Lacunas e melhorias sugeridas

Prioridade de implementação (Alta, Média, Baixa)

Restrições:

Não gerar código de front-end

Não alterar backend; apenas planejar e documentar

Não criar mockups gráficos — focar em estrutura, hierarquia e fluxo

Manter consistência com padrões já existentes (React SPA, Django templates)

Exemplo resumido de saída esperada:

Página: Dashboard (/app/dashboard)
Objetivo: Mostrar resumo de progresso e estatísticas do usuário
Elementos:
  - Sessão 1: Cards de progresso (visualizar cursos ativos, completados)
  - Sessão 2: Gráficos de performance (estatísticas de completude e tempo)
  - Sessão 3: Alertas / notificações importantes
Funcionalidades implementadas: Login via JWT, cards estáticos
Lacunas: Dados dinâmicos não conectados, breadcrumbs limitados
Fluxo ideal: Usuário logado → abre dashboard → vê cards resumidos → clica para detalhes do curso → navega para lições
Prioridade: Alta