# Relatório Estratégico — Páginas Instrutor/Admin

> Documentação consolidada das principais views voltadas ao instrutor/admin, com foco em elementos, hierarquia, lacunas de UX e representações conceituais.

> Nota: este documento foi transformado em um planejamento estruturado com arquivos por etapa em `docs/planning/`. Para execução e tickets, consulte `docs/planning/README.md`.

## Dashboard (view principal)
- **Objetivo principal:** oferecer visibilidade imediata de KPIs e sessões ativas do ecossistema de cursos e alertar para ações necessárias.
- **Sessões / Elementos:**
  1. **AI Insight Hero** — painel hero com título, descrição de insight e botão “Detalhes completos” (inativo). Papel informativo/estratégico; hover sem mudança; estado “em breve”. Depende de insights IA.
  2. **Cards métricos (active, lessons today, students, materials)** — indicadores numéricos puxados de `/core/dashboard/stats/`; tipo cartão informativo com hover sutil; prioridade alta; dinâmico com loading.
  3. **Sessões Recentes** — lista de cards com status, hora e botão de refresh; ação secundária (atualizar) + info; depende de `/cognition/sessions/` e token JWT; interação futura: clique para expandir sessão.
  4. **Atividade Recente** — timeline textual com itens e botão “Ver logs” (desabilitado); informativo; estado condicional (logs disponíveis ou vazio).
- **Funcionalidades implementadas:** fetch estatísticas, sessões, skeletons/loading, CTA refresh.
- **Lacunas:** CTAs “Detalhes completos” e “Ver logs” inativos, ausência de ligação para cursos/aulas, falta de breadcrumbs e de orientações para próximas ações críticas.
- **Fluxo ideal:** login → dashboard carrega KPIs → identifica sessão crítica → navega para curso/alerta correspondente → aciona ação (publicar curso, intervir ou checar módulo).
- **Prioridade:** Alta.

### Fluxos condicionais
- **Se não houver sessões ativas:** mostrar estado vazio com ícone e CTA para agendar ou inspecionar alertas, mantendo o painel de KPIs visível.
- **Se o fetch de KPIs falhar (timeout ou 401):** exibir toast de erro, esvaziar os valores (00) e sugerir reautenticação ou recarregamento da página.
- **Se o token expirar enquanto estiver na página:** bloquear interações e redirecionar para a tela de login, com mensagem contextual.
- **Se um alerta for clicado mas o contexto não carregar:** manter o card na lista e mostrar mensagem “Contexto indisponível, tente novamente”.

### Análise da Estrutura
- **Layout:** Header top bar (título da view, notificações, perfil), sidebar fixa, painel central responsivo; sem footer.
- **Hierarquia:** hero → grid KPIs → seção principal (Sessões) com painel secundário (Atividade). Painel principal ocupa mais espaço (2/3), secundário complementa.
- **Elementos listados:** hero card (informativo), 4 KPIs (cards), painel de sessões (lista + botão update), mensagens de loading/vazio, timeline de atividade, botão refresh.
- **Dependências:** `/core/dashboard/stats/` (KPIs), `/cognition/sessions/` (sessões), autenticação permanente, design tokens (variáveis de cor). Proposed states: visível, dinâmico, condicional.

### Representações visuais
1. **Wireframe textual:** Sidebar (Dashboard · Alertas · Cursos · Materiais · AI Center) → Header (título + notificações) → Conteúdo: Hero → Cards métricos (grid) → Sessões / Timeline.
2. **Fluxo do usuário:** Login → Dashboard → examina KPIs → identifica sessão crítica → navega para detalhes (curso/alerta) → executa ação (Publicar/Intervir).
3. **Mapa hierárquico:** Portal Instrutor → Dashboard → Sessões Recentes + Atividade → links para Cursos/Alertas.
4. **Quadro de prioridade:** Hero (informativo/média), KPIs (informativo/alta), Sessões (ação secundária/alta), Atividade (informativo/média).

---
## Alertas do Instrutor
- **Objetivo principal:** sinalizar sessões escaladas pela cognição e permitir intervenções humanas explícitas.
- **Sessões / Elementos:**
  1. Header com tag “Human Intervention Required” (informativo crítico).
  2. Cards de alerta (ícone, dados do usuário, aula, timestamp, botão “Intervir Agora”). Ação principal crítica; hover realça e exibe botão destacado.
  3. Estados de loading/vazio com animações pulsantes ou mensagens de sucesso.
- **Funcionalidades implementadas:** polling `/api/v1/cognition/sessions/?status=escalated` a cada 30s, cards dinâmicos, botões com stub.
- **Lacunas:** botão abre apenas `alert`, falta modal/chat/registro; ausência de prioridade por gravidade, papel diferenciando instrutor/admin.
- **Fluxo ideal:** alerta aparece → instrutor avalia contexto → clica em “Intervir Agora” → abre canal seguro/modal → registra ação → alerta é resolvido/retonado ao dashboard.
- **Prioridade:** Alta.

### Fluxos condicionais
- **Se o alerta for resolvido ou duplicado:** o card é retirado da lista, o dashboard pode receber sinal visual (badge verde) e o histórico registra o atendente.
- **Se a chamada à API falhar (timeout/401):** exibir mensagem de erro no topo, manter o card com badge “Re-tentar” e acionar polling estendido.
- **Se o instrutor não tiver permissão:** botões podem ficar ocultos ou apresentar tooltip “somente admins” e enviar alerta ao monitoramento.

### Análise da Estrutura
- **Layout:** header + lista vertical de cards com ação crítica.
- **Hierarquia:** header → cards; cada card divide contexto (usuário/aula) e ação (botão). Botão “Intervir Agora” (botão principal), timestamps (informativo), ícone (alerta), estado de loading/vazio.
- **Dependências:** API `/cognition/sessions/`, token; necessidade de futuro canal de intervenção (chat/modal) e logs. Elementos: panel, botão, indicador, mensagem de estado.

### Representações visuais
1. **Wireframe textual:** Header de alerta → Lista de cards (ícone + texto + ação) → feedback “sem alertas”.
2. **Fluxo:** Dashboard → Alertas → seleciona card → Intervenção (modal/handler) → confirma e registra.
3. **Mapa hierárquico:** Portal → Alertas → Cards escalados → Fluxos de intervenção.

---
## Meus Cursos
- **Objetivo principal:** permitir gestão, busca e acesso detalhado ao portfólio de cursos.
- **Sessões / Elementos:**
  1. Header com título “Gerenciamento” e badge “Ações desabilitadas”. Informação contextual.
  2. Botão “+ Criar novo curso” (desabilitado) — ação secundária futura.
  3. Barra de busca com input e filtro “Todos / Publicados” (ações primárias). Interactive input (seminar) com loading e placeholder.
  4. Grid de cards de curso: badge de status, título, número de alunos, avatares fictícios, botão “Visualizar” ativo (ação principal) e “Editar” desabilitado.
  5. Skeletons e mensagem “Nenhum curso encontrado”.
- **Funcionalidades implementadas:** busca/filtro com `/courses/`, cards dinâmicos, loading, estado vazio.
- **Lacunas:** criação/edição bloqueadas; falta paginação/agrupamento, indicadores de progresso, breadcrumbs e distinção de papéis.
- **Fluxo ideal:** instrutor aplica filtro → localiza curso → clica “Visualizar” → flui para detalhe do curso → continua para aulas ou gerenciamento de coortes.
- **Prioridade:** Alta.

### Fluxos condicionais
- **Se a busca não retornar cursos:** exibir mensagem ilustrada com sugestão de limpar filtros ou criar novo curso; sugerir fallback para fallback.  
- **Se o filtro “Publicados” estiver ativo e não houver cursos publicados:** manter os cards no estado vazio e permitir alternar para “Todos” sem reset automático.
- **Se o token expirar durante a busca:** impedir novos requests e redirecionar para login com aviso de sessão.
- **Se o backend responder com erro (500/timeout):** mostrar toast “Erro ao carregar portfólio” e manter o último conjunto de dados em cache até novo reload.

### Análise da Estrutura
- **Layout:** header → painel de controles (busca/filtros) → grid responsivo de cards.
- **Hierarquia:** ações → filtros → conteúdo; cada card contém badge, título, métrica, botões.
- **Elementos:** input de busca (formulário, ação primária), botões de filtro (ação secundária), cards (informativo), badges (status), botões “Visualizar” (ação principal), “Editar” (secundária/desabilitada), skeletons/vazio.
- **Dependências:** `/courses/`, autenticação, design tokens e layout de cards.

### Representações visuais
1. **Wireframe textual:** Sidebar/Menu → Header + botão → Busca/filtros → Grid cards → CTA “Visualizar”.
2. **Fluxo:** Dashboard → Cursos → aplica busca/filtro → escolhe curso → vai para detalhe.
3. **Mapa hierárquico:** Portal → Meus Cursos → Curso Detail → Aulas.
4. **Quadro de prioridade:** Cards (alta), filtros (alta), botões “Criar” (média/futuro).

---
## Detalhe do Curso
- **Objetivo:** apresentar preço, descrição, módulos, aulas e permitir matrícula/compra.
- **Sessões / Elementos:**
  1. Botão “Voltar para portfólio” (navegação secundária).
  2. Hero com preço, título, descrição, CTA principal (Matricular/Comprar) e estado (“Já Matriculado” ou processing). Badge mostra preço ou acesso gratuito.
  3. Lista de módulos: cada módulo card tem cabeçalho (título, contador de aulas, menu de opções desabilitado) e lista de aulas cliqueveis (ícone + botão “Acessar”).
- **Funcionalidades:** fetch `/courses/<id>/`, integração Stripe (checkout session), `authClient.enrollInCourse`, navegação para aula selecionada.
- **Lacunas:** sem UI de escolha de coorte antes do CTA, menu contextual vazio, falta de indicadores de progresso/perfil de usuário, sem detalhes de pré-requisitos.
- **Fluxo ideal:** instrutor revisa hero → confirma preço → escolhe coorte (futuro) → aciona matrícula → prossegue para aulas → acessa desafios.
- **Prioridade:** Alta.

### Fluxos condicionais
- **Se o usuário já estiver matriculado:** o botão principal fica desabilitado e mostra “Já Matriculado”, o hero exibe badge de status e sugere visitar as aulas.
- **Se o curso for gratuito:** o CTA mostra “Matricular-se Grátis” e ignora o fluxo Stripe, mas ainda registra o evento no backend antes de liberar aulas.
- **Se o processo de matrícula estiver em curso (espera Stripe):** o botão entra em estado “Processando...” com spinner e evita toques repetidos; um alerta informa que o checkout foi iniciado.
- **Se o pagamento falhar:** exibir erro contextual + sugestão de retry, e manter o botão ativo com texto “Tentar novamente”.

### Estrutura
- **Layout:** botão voltar → hero central → lista de módulos em sequência.
- **Hierarquia:** hero (CTA central) → módulos (cartões com listas). Elementos: hero painel, CTA (ação principal), badges, menus inativos, listas de aulas, botões “Acessar”, indicadores de vazio/módulos nulos.

### Representações visuais
1. **Wireframe textual:** Topo (voltar) → Hero (preço + CTA) → Módulos → Aulas.
2. **Fluxo:** Cursos → Detalhe do curso → Escolhe CTA → Matrícula/Checkout → Aulas → Submissão.
3. **Mapa hierárquico:** Meus Cursos → Curso Detail → (Aulas → Desafios) → Voltar.

---
## Aula / Desafio
- **Objetivo:** entregar conteúdo (texto/vídeo) e ambiente de submissão para desafios.
- **Sessões / Elementos:**
  1. Breadcrumb/back.
  2. Painel de conteúdo (título, vídeo embed condicional, texto em `prose`).
  3. Sessão “Desafio” com descrição, testes públicos, `CodeEditor`, botão “Submeter Resposta”, feedback success/error (alerta colorido).
- **Funcionalidades:** fetch `/lessons/<id>/`, embed de vídeo, editor com indentação via Tab, submissão `/submissions/`, resultado mostrando `status`/`result_summary`.
- **Lacunas:** não há histórico de envios, indicadores de progresso, CTA para pedir revisão/ajuda; feedback limitado; step-by-step não destacado.
- **Fluxo ideal:** Detalhe do curso → Seleciona aula → consome conteúdo → resolve problema no editor → submete → aguarda feedback → reitera.
- **Prioridade:** Alta.

### Fluxos condicionais
- **Se a submissão for bem-sucedida:** mostrar alerta verde com resumo, liberar próximo desafio e atualizar histórico local (em S3/S4).<br>
- **Se ocorrer falha de execução (timeout, erro de compilação):** exibir alerta vermelho com detalhes dos testes, manter o editor ativo para correções e destacar o botão “Submeter Resposta” para nova tentativa.
- **Se o backend retornar 401/403:** limpar token e forçar redirecionamento para login, com mensagem explicando expiração ou falta de permissão.
- **Se houver perda de conexão durante o envio:** habilitar retry manual e salvar o código local (auto-save) enquanto reconecta.

### Estrutura
- **Layout:** vertical; topo (voltar) → conteúdo → desafio.
- **Hierarquia:** conteúdo explicativo → task build; elementos: iframe, texto, editor (formulário), botão, alertas.

### Representações visuais
1. **Wireframe textual:** Voltar → Conteúdo (vídeo/texto) → Desafio (descrição + editor + botão + feedback).
2. **Fluxo:** Curso → Aula → Leitura → CodeEditor → Submissão → Feedback → Repetir ou avançar.
3. **Mapa hierárquico:** Curso Detail → Aula → Desafio.

---
## Materiais
- **Objetivo:** centralizar recursos complementares (PDFs, slides, códigos).
- **Sessões / Elementos:** header com título e botão “+ Novo material” (desabilitado); lista de cards (título, tipo, aula, tempo atualizado; botões fixar/compartilhar desabilitados).
- **Funcionalidades:** dados estáticos (sampleMaterials), layout com cartões.
- **Lacunas:** não há API, ações, filtros, upload/download nem atribuição a coortes.
- **Fluxo ideal:** instrutor filtra → abre material → usa ações (fixar/compartilhar) → relaciona a aula.
- **Prioridade:** Média.

### Fluxos condicionais
- **Se novos materiais forem adicionados:** cards aparecem no topo com badge “Novo” e notificações podem ser disparadas aos instrutores.
- **Se uma ação (fixar/compartilhar) estiver indisponível:** manter botão desabilitado com tooltip explicando “Funcionalidade em desenvolvimento” e registrar telemetria.
- **Se a lista ficar vazia:** exibir call-to-action secundário para solicitar material ao time de conteúdo.

### Estrutura
- **Layout:** header + cards empilhados.
- **Elementos:** cards (informativo), botões desabilitados, tags e timestamps.

### Representações visuais
1. **Wireframe textual:** Header → Lista de cards (titulo + meta + ações). 2. **Fluxo:** Cursos/Aulas → Materiais → Filtro → Ações fixar/compartilhar. 3. **Mapa hierárquico:** Portal → Materiais.

---
## AI Center
- **Objetivo:** oferecer ambiente seguro de execução WebSocket e monitoramento de agentes de IA.
- **Sessões / Elementos:**
  1. Header com indicador de status (led) e texto contextual.
  2. Cartão “Modelo Ativo”: select de provider, barra de uso de tokens; tipo painel/formulário.
  3. Cartão “Agentes & Personas”: cards de agentes ativos com status e badge.
  4. Console streaming: painel de logs (texto), painel do editor (linguagens buttons), botão “Executar Código”.
- **Funcionalidades:** WebSocket `/ws/execute/<session>/`, logs em tempo real, seleção de linguagem, envio de código.
- **Lacunas:** ausência de backend persistido/documentado para WebSocket, seleção de modelo sem impacto financeiro, falta de histórico, nenhuma ação de salvar logs ou timeline de comandos.
- **Fluxo ideal:** Dashboard/Alertas → AI Center → Escolhe modelo/linguagem → Digita comando → Executa → Monitora logs → Salva/compartilha resultado.
- **Prioridade:** Média.

### Fluxos condicionais
- **Se a conexão WebSocket cair:** atualizar o status para “Recuperando Link”, enfileirar comandos e notificar o usuário com opção de reconexão manual.
- **Se o log mostrar erro crítico (stderr):** destacar o trecho em vermelho e sugerir execução diagnóstica complementar antes de reenviar.
- **Se o modelo selecionado não responder:** mudar o status para “Falha crítica” e permitir fallback para outro provedor sem perder o código no editor.
- **Se o uso de tokens estiver quase no limite:** exibir tooltip/alerta próximo ao indicador com sugestão de otimizar chamadas ou migrar para plano superior.

### Estrutura
- **Layout:** grid 3 colunas (modelo, agentes, console/editor). Elementos: select (formulário), status indicator, logs (painel), CodeEditor (formulário), botão executar (ação principal).

### Representações visuais
1. **Wireframe textual:** Status + Modelo → Agentes → Console + Editor. 2. **Fluxo:** Dashboard → AI Center → Execução → Logs. 3. **Mapa hierárquico:** Portal → AI Center → Logs/Editor.

---
## Assinaturas (Billing)
- **Objetivo:** exibir planos e recibos de pagamentos.
- **Sessões / Elementos:** header, cards mostrando plano, status, valor, botão “Ver recibos”.
- **Funcionalidades:** fetch `/payments/subscriptions/` (sem JWT na view atual).
- **Lacunas:** rota não integrada ao sidebar, visual deslocado (fundo branco), ausência de ações (cancelar, atualizar), nenhum link entre planos e cursos.
- **Fluxo ideal:** Billing → seleciona plano → vê recibos → aciona upgrade/cancelamento.
- **Prioridade:** Baixa.

### Fluxos condicionais
- **Se o usuário não tiver assinaturas ativas:** mostrar cartão “Nenhuma assinatura ativa” com CTA secundário para ver planos.
- **Se a API retornar erro (ex: 403):** exibir alerta e instruir a atualizar o token ou contatar billing.

### Estrutura
- **Layout:** página isolada com cards em colunas.

### Representações visuais
1. **Wireframe textual:** Header → Cards de assinatura → Botões “Ver recibos”. 2. **Fluxo:** Navegação secundária (futura) → Área Financeira → Plano → Recibos. 3. **Mapa hierárquico:** Portal → (futuro) Billing/Subscriptions.

---
## Tabela de Fluxos Condicionais
| Página | Elemento | Condição | Estado resultante | Ação sugerida |
| --- | --- | --- | --- | --- |
| Dashboard | Sessões Recentes | Sem sessões ativas | Estado vazio ilustrado + CTA “Agendar / Ver Alertas” | Manter KPIs visíveis e destacar CTA para ações alternativas |
| Alertas | Botão “Intervir Agora” | Alerta resolvido ou duplicado | Card removido e badge verde | Atualizar dashboard, registrar no histórico e notificar instrutor |
| Alertas | Polling / API | Timeout ou 401 | Mensagem de erro, badge “Re-tentar” | Expandir intervalo de polling e exibir retry manual |
| Meus Cursos | Busca e filtros | Sem resultados | Mensagem ilustrada sugerindo limpar filtros/criar curso | Oferecer fallback e manter filtros intactos |
| Meus Cursos | Filtro “Publicados” | Nenhum curso publicado | Lista vazia mantida | Permitir trocar para “Todos” sem reset automático |
| Detalhe do Curso | Hero CTA | Usuário já matriculado | Botão desabilitado, badge “Já Matriculado” | Sugerir visita às aulas e destacar progresso |
| Detalhe do Curso | Hero CTA | Curso gratuito | CTA “Matricular-se Grátis”, não chama Stripe | Registrar evento no backend e liberar aulas imediatamente |
| Detalhe do Curso | Hero CTA | Processo de matrícula em andamento | Estado “Processando...”, spinner e alerta de checkout iniciado | Bloquear novos cliques até callback do Stripe |
| Aula / Desafio | Submissão | Sucesso | Alerta verde, liberar próximo desafio | Atualizar histórico local e incentivar continuação |
| Aula / Desafio | Submissão | Erro de execução (timeout/compilação) | Alerta vermelho e editor ativo | Destacar botão “Submeter Resposta” para retry |
| Aula / Desafio | Submissão | 401/403 | Limpar token e redirecionar para login | Explicar expiração/permissão e reiniciar fluxo de auth |
| Materiais | Botões fixar/compartilhar | Funcionalidade indisponível | Botões desabilitados com tooltip | Registrar telemetria e sinalizar roadmap |
| AI Center | Consoles / logs | WebSocket caído | Status “Recuperando Link”, comandos enfileirados | Oferecer reconexão manual e reenvio automático |
| AI Center | Indicador de tokens | Uso próximo ao limite | Tooltip/alerta sugerindo otimizar chamadas | Encaminhar para upgrading de plano ou reduzir uso |
| Assinaturas | Cards | Sem assinaturas ativas | Cartão “Nenhuma assinatura ativa” | CTA para ver planos e acionar venda |
## Representações Gerais

## Tabela de Criticidade dos Elementos
| Elemento | Página | Função | Estado | Prioridade | Dependência / API |
| --- | --- | --- | --- | --- | --- |
| Cards de KPIs (Cursos ativos, Aulas hoje, Alunos, Materiais) | Dashboard | Informativo / suporte à decisão | Dinâmico, atualizado via API | Alta | `/core/dashboard/stats/` |
| Sessões recentes (cards com status) | Dashboard | Detecção de ação | Dinâmico, requer dados em tempo real | Alta | `/cognition/sessions/` |
| Botão “Intervir Agora” | Alertas | Ação principal crítica | Ativo (sem backend final) | Alta | `/api/v1/cognition/sessions/?status=escalated` |
| Busca e filtros (Todos/Publicados) | Meus Cursos | Ação primária de refinamento | Ativo | Alta | `/courses/` com query params |
| Botão “Visualizar” em cada card | Meus Cursos | Ação de navegação | Ativo | Alta | Roteamento interno para detalhe com fetch `/courses/<id>/` |
| Hero do curso (preço, CTA matricular/comprar) | Detalhe do Curso | Conversão | Ativo, depende de matrícula/checkout | Alta | `/payments/payments/create_checkout_session/`, `/courses/<id>/enroll/` |
| Lista de módulos/aulas | Detalhe do Curso | Navegação para aulas | Dinâmico | Alta | `/courses/<id>/` contém módulos e lessons |
| Editor + botão “Submeter Resposta” | Aula | Resolução de desafio | Ativo com feedback | Alta | `/submissions/` |
| Botões “Criar curso”, “Editar”, “Fixar”/“Compartilhar” materiais | Cursos / Materiais | Ações administrativas | Desabilitados | Média | Futuras APIs de criação/edição |
| Console/logs e select de modelo | AI Center | Exploração e debug | Ativo, WebSocket | Média | `/ws/execute/<session>/` e lógica interna de agentes |
| Cards de materiais | Materiais | Informativo de recursos | estático/sem API | Média | futura API de materiais |
| Cards de assinaturas | Assinaturas | Informativo financeiro | Ativo isolado | Baixa | `/payments/subscriptions/` |


---
## Estado do Usuário / Papel
- **Dashboard – Cards métricos e Sessões Recentes**: visíveis para admins e instrutores, pois dependem de dados institucionais; usuários comuns (alunos) não acessam essa view.
- **Alertas – Botão “Intervir Agora”**: instrutor/admin ativo; oculto para alunos. Caso um usuário tente acessar sem permissão, exibir aviso de acesso restrito.
- **Meus Cursos – Botões de criação e edição**: visíveis apenas para admins/instrutores com permissão de staff (docs de backend confirmam `IsInstructorOrStaff`); alunos apenas veem os cursos em que estão matriculados em views separadas.
- **Detalhe do Curso – CTA de matrícula**: instrutores/admins veem o CTA para ações de publicação ou matrícula de alunos, alunos veem versões adaptadas (inscreva-se). Estado depende do role flag retornado em `/auth/me/`.
- **Aulas e Desafios – Submissão de código**: disponível para instrutores/admins ao testar ou validar fluxos e para alunos/instrutores que estão matriculados; o backend usa permissões `IsInstructorOrStaff` para edição e `IsAuthenticated` para submissões.
- **AI Center – Seletores e Execução**: restrições administrativas fortes (somente instrutores/admins), usuários normais não veem o menu; em caso de tentativa de acesso, o server retorna 403 e o cliente redireciona para dashboard.
- **Materiais – Botões de fixar/compartilhar**: atualmente desativados, mas quando prontos serão liberados somente para instrutores/admins; alunos acessam lista apenas como consumidores sem ações.
- **Assinaturas – Plano e recibos**: visível para todos os perfis autenticados, porém botões de gerenciamento (>cancelar, upgrade) ficam restritos a admins responsáveis pelo billing.

---
## Rastreamento e Auditoria
- Logar `session_id`, `course_id`, `lesson_id` e `submission_id` em cada CTA crítico para permitir correlação com o filamento dimensional e a trilha S1a–S4.
- Expor esses IDs na UI (mini badges ou tooltips) quando apropriado, por exemplo no painel de Alertas/AI Center, para facilitar debugging e comunicação com suporte.
- Instrumentar o backend para propagar `story_id`, `vector_id` e status final em respostas JSON para que o frontend possa mostrar status de aceitação/ajuste/bloqueio.

## Mapa de Navegação Cruzada
- **Alertas** → **Detalhe do Curso** → **Aula** → **Submissão** → **Dashboard** (feedback loop e indicadores de progresso).
- **Dashboard** também leva a **Cursos**, **Materiais** e **AI Center**, que podem disparar novos alertas ou registrar submissões diretamente no fluxo de audit log.
- **Assinaturas** e **Materiais** são acessíveis transversalmente; use breadcrumbs e links contextuais (“Ver materiais relacionados”) para reforçar coesão.

## Métricas de UX sugeridas
1. Tempo médio para intervir em alerta (do surgimento do card até a ação no CTA).
2. Taxa de erro de submissões por aula para priorizar feedback instantâneo.
3. Cliques totais para completar matrícula/comprar (Dashboard ▶️ Cursos ▶️ Detalhe ▶️ CTA).
4. Tempo de percepção dos KPIs após resolução de alertas (atualização do dashboard).
5. Tempo de reconexão do WebSocket do AI Center após desconexão.
6. Frequência de CTA críticos com estado “em breve” ativados (para medir progresso de implementação).

## Checklist de CTAs críticos
| CTA | Página | Estado atual | Estado esperado | Dependência / Observação |
| --- | --- | --- | --- | --- |
| “Detalhes completos” | Dashboard | Desabilitado | Exibir modal com logs/insights e botões de ação | Requer endpoint de insights IA + layer de logs
| “Ver logs completos” | Dashboard | Desabilitado | Abrir painel com histórico do worker/AI | Logs do worker e permissões (admin)
| “Intervir Agora” | Alertas | Mostra alert, não há modal | Abrir modal/chat e registrar ação | Chat service e webhook do filamento
| “Criar novo curso” | Meus Cursos | Botão desabilitado | Modal/form completo e POST `/courses/` | Endpoint de criação + validações (S1a/S1b)
| “Matricular/Comprar” | Detalhe do Curso | Ativo mas sem seleção de coorte | Agregar coorte + Stripe + mensagens de status | `/courses/<id>/enroll/`, Stripe checkout
| “Submeter Resposta” | Aula | Básico (feedback inline) | Streaming + histórico de submissões + status (success/fail) | `/submissions/`, execução sandbox, telemetria
| “Executar Código” | AI Center | Envia comando via WS | Persistir sessão e logs + alerta | `/ws/execute/`, storage, observabilidade

## Fluxogramas de Navegação (descrição)
- **Linear crítico:** Login → Dashboard → Cursos/Alertas → Detalhe do Curso → Aula → Submissão → Dashboard.
- **Fluxo paralelo:** Dashboard → AI Center → Execução → Logs → (possível) Alertas → Dashboard.
- **Fluxo de suporte:** Qualquer página (exceto Billing) mantém sidebar fixo + breadcrumbs, evitando dead-ends e permitindo voltar ao Dashboard em ≤2 cliques.
## Diretivas para o roadmap
1. Ligar CTA críticos a ações reais e adicionar breadcrumbs/URLs permanentes para rastreabilidade dos estados dimensionais S1a–S4.
2. Preencher gaps com base em `docs/screens.md`, priorizando alertas intervenções e materiais/IA conectados a dados reais.
3. Validar UX e hierarquia com micro testes/prototipagem para assegurar que instrutores/admins distinguem claramente ações, contexto e próximos passos.
