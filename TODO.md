# Synapse Roadmap & Task Tracker

## Marcos Concluídos ✅

### 1. Consolidação e Governança de Branches
- [x] Unificação e merge das branches de telemetria, pagamentos e correlação na branch principal `main`.
- [x] Configuração de repositório remoto `origin` sincronizado em `alar98-dev/Synapse.git`.

### 2. Refatoração DDD, SOLID e ORM (Courses & Submissions)
- [x] Extração de regras de negócio de `courses/views.py` para camada de serviços de domínio:
  - `EnrollmentService`: Validação de capacidade de turmas, regras de duplicidade e ciclo S1a -> S4.
  - `CohortLeaderboardService`: Agregação de pontos de gamificação e classificação de turmas.
- [x] Proteção contra IDOR em `submissions/serializers.py` (`user` configurado como `read_only`).
- [x] Propagação e persistência estrita de `correlation_id` em submissões.

### 3. Integração com Polaris Agent (:8080)
- [x] Implementação de `PolarisClient` em `courses/services/polaris_client.py`.
- [x] Health check automático e síntese de código inicial (`initial_code`) e gabarito (`test_template`) com fallback resiliente.
- [x] Cobertura de testes unitários para o cliente Polaris (4 testes com mocks e fallbacks).

### 4. Motor de Avaliação Socrática (Cognition)
- [x] Adição do campo `needs_human_intervention` no modelo `AssessmentSession` com migração `0002`.
- [x] Criação de suíte de testes unitários e de API em `cognition/tests/test_cognitive_orchestrator.py`.
- [x] Resolução de conflito de importação com `--import-mode=importlib` no `pytest.ini`.

### 5. Banco de Dados Local & Grade Inicial de Lançamento
- [x] Provisionamento de banco local `synapse_db` no PostgreSQL 17 com extensão `pgvector`.
- [x] Aplicação de todas as migrações Django pendentes.
- [x] Povoamento via `scripts/seed_data.py` com a grade inicial de 6 cursos (2 gratuitos, 4 avançados):
  - Trilha 1 (Gratuita): Lógica & Algoritmos Práticos; Clean Code & Princípios SOLID.
  - Trilha 2 (Premium): Domain-Driven Design (DDD) na Prática; Microsserviços & Event-Driven APIs.
  - Trilha 3 (Premium): Concorrência Segura & Memória Zero-Copy; Engenharia de IA & Avaliação Socrática.

### 6. Qualidade & Testes Automatizados
- [x] **49 testes automatizados** executados e 100% aprovados em ~1,64s.

---

## Próximos Passos Priorizados 🔄

### Fase 1: Governança, RBAC e Perfil do Aluno
- [x] Implementar serviço de cálculo de sequências diárias de estudo (`ProgressService.calculate_streak`) em `courses/services/`.
- [x] Criar testes unitários para verificação de streaks consecutivos e quebra de sequência (4 testes passando).
- [x] Criar serviço de RBAC (`RBACService`) e comando `manage.py setup_rbac` (grupos `Administrators`, `Instructors`, `Students`, `Auditors`).
- [x] Expor e cobrir com testes o endpoint `/api/v1/auth/me/stats/` retornando streaks, turmas, grupos e métricas reais de aprendizado.

### Fase 2: Interface Web & Consumo da API
- [ ] Revisar as rotas da SPA no `frontend/` para listar os 6 cursos populados no banco.
- [ ] Validar o fluxo visual de inscrição gratuita vs checkout de cursos pagos.

### Fase 3: Validação do Sandbox de Código
- [ ] Executar teste de ponta a ponta com o worker do Celery processando um exercício real no Sandbox.
