# Descrição de Telas - Synapse (Template e Telas Principais)

Este documento descreve telas principais da plataforma e fornece um template para detalhamento de cada tela (componentes, dados, fluxos e critérios de aceitação).

Template por Tela
- Nome da Tela: (ex: `Student Dashboard`)
- Objetivo: Breve objetivo da tela.
- Principais Atores: (Aluno, Professor, Admin)
- Componentes Principais: Lista de componentes UI (cards, tabelas, editor, player).
- Fluxo de Usuário (principal): Passos que o usuário realiza na tela.
- Dados necessários: Campos/objetos que a tela consome (APIs/endpoints esperados).
- Ações e Call-to-Actions: Botões e interações principais.
- Critérios de Aceitação: O que valida que a tela está pronta.
- Considerações Mobile/Responsividade: Notas para versão mobile.
- Acessibilidade: pontos de contraste, labels, navegação por teclado.

Telas Prioritárias (esboço inicial)

1) Landing / Marketing
- Objetivo: Atrair e converter visitantes; destacar cursos e benefícios.
- Atores: Visitante, Lead.
- Componentes: Hero, CTA (Inscreva-se), Lista de cursos em destaque, Depoimentos, FAQ, Footer com links legais.
- Dados: API pública de cursos (título, resumo, imagem, preço).
- Ações: Inscrever-se / Conhecer mais.
- Critérios: CTA visível acima da dobra; responsivo; SEO friendly.

2) Catálogo de Cursos
- Objetivo: Permitir descoberta e filtragem de cursos e trilhas.
- Atores: Visitante, Aluno.
- Componentes: Filtros (nível, tópico, preço), Lista em cards, Paginação/infinite scroll.
- Dados: endpoint `/api/v1/courses?filters...` retornando metadados e disponibilidade de cohort.
- Critérios: Filtros funcionais; carregamento progressivo; acessível.

3) Página do Curso / Detalhe
- Objetivo: Detalhar currículo, cohorts disponíveis e CTA para matrícula.
- Componentes: Syllabus, Calendário de Cohorts, Instrutor, Depoimentos, Preço, FAQ, CTA Matrícula.
- Dados: `/api/v1/courses/{id}`, `/api/v1/cohorts?course_id={id}`.
- Ações: Aplicar cupom, iniciar inscrição.

4) Página de Cohort (Turma)
- Objetivo: Visão da turma atual (cronograma, alunos, links de reunião).
- Atores: Aluno inscrito, Professor.
- Componentes: Cronograma, Lista de alunos (opt-in), Botões de Entrar na Aula, Replays.
- Dados: `/api/v1/cohorts/{id}` e `/api/v1/schedule?cohort_id={id}`.

5) Dashboard do Aluno (principal)
- Objetivo: Mostrar progresso, próximas aulas, tarefas pendentes e score.
- Componentes: Resumo de progresso (skill tree), próximos eventos, últimas submissões, atalhos para sandbox e fórum.
- Dados: `/api/v1/users/{id}/progress`, `/api/v1/users/{id}/upcoming`.
- Ações: Abrir exercício, entrar na aula, pedir mentoria.
- Critérios: Visualização clara do progresso; CTA para retomar último exercício.

6) Player de Aula + Editor (Split View)
- Objetivo: Permitir assistir à aula enquanto edita/rodar código.
- Componentes: Video player com transcrição e indexação por timestamp; Editor de código (Monaco) com painel de execução; Chat Q&A lateral; Resumo gerado pela IA.
- Dados: vídeo (S3 URL), transcrição VTT, estado do sandbox (`/api/v1/sandbox/{session}`), chat websocket.
- Ações: Executar código, submeter, pedir hint ao agente.
- Critérios: Execução de código isolada, sincronização tempo->transcrição, chat em tempo real.

7) Sandbox IDE (full-screen)
- Objetivo: Ambiente completo para desenvolvimento e submissão de projetos.
- Componentes: Editor, Terminal/Output, File explorer, Run/Reset, Upload dataset.
- Dados: endpoints para iniciar sessão de sandbox, salvar, listar arquivos, executar.

8) Página de Submissão / Feedback
- Objetivo: Submeter projeto, visualizar resultados dos testes e feedback IA/humano.
- Componentes: Upload, resultados dos testes, relatório de estilo, botão para re-submissão.
- Dados: `/api/v1/submissions`, `/api/v1/submissions/{id}/results`.

9) Dashboard do Professor / Monitor
- Objetivo: Gestão da turma, reviews, análise de engajamento e mensagens.
- Componentes: Lista de alunos, fila de submissões, chat/proctoring tools, painel de analytics.

10) Admin Panel (Operações)
- Objetivo: Gerenciar conteúdo do curso, cohorts, pagamentos, relatórios.
- Componentes: CRUD de cursos/cohorts, relatórios financeiros, gerenciamento de usuários e roles.

Como proceder
- Escolha 3 telas para detalharmos primeiro (ex: `Dashboard do Aluno`, `Player + Editor`, `Página do Curso`).
- Para cada tela eu criarei a descrição completa com endpoints API necessários, componentes React propostos, estado local e exemplos de payloads.

Arquivo criado: `screens.md`. Diga quais 3 telas quer priorizar e eu gero as descrições detalhadas e os contratos de API/props componentes.
