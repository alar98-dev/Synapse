# Sandbox Dimensional — Variáveis de Ambiente

Este arquivo descreve cada entrada presente em `.env.sandbox.example`, explicando o papel que cada variável tem no ambiente de testes dimensional que acabamos de montar. Use como referência ao configurar o sandbox local ou ao documentar o pipeline do CourseEnrollment.

| Variável | Propósito | Exemplos / Observações |
| --- | --- | --- |
| `DEBUG` | Liga o modo de depuração do Django, útil para observar logs detalhados e erros durante protótipos. | `True` habilita tracebacks; em produção deve ser `False`. |
| `SECRET_KEY` | Chave usada pelo Django para assinar sessões/cookies e proteger links criptográficos. | Valor fixo `dimensional-sandbox-secret`, suficiente para ambientes fechados. |
| `DATABASE_URL` | Define o banco que o sandbox vai usar; neste caso um SQLite local isolado. | `sqlite:///./synapse_sandbox.db` cria um arquivo da raiz do projeto. |
| `REDIS_URL` | Endpoint do Redis usado por tarefas assíncronas ou caching que o sandbox pode acionar. | Usa a instância local no database 1 para separação de dados. |
| `ALLOWED_HOSTS` | Lista de hosts válidos para requisições HTTP. | `localhost,127.0.0.1` garante que apenas conexões locais sejam aceitas na sandbox. |
| `SANDBOX_API_URL` | URL base simulada do serviço API de teste. | Os scripts podem referenciar esse valor para construir callbacks ou links. |
| `SANDBOX_WEBHOOK_KEY` | Chave simbólica usada para autenticar requests internos do webhook. | O n8n pode validar esse cabeçalho antes de aceitar payloads. |
| `SANDBOX_TEST_TOKEN` | JWT de teste que representa um aluno sandbox (`USER123`). | Serve para autorizar `POST /enroll` quando se dispara os testes manuais. |
| `FILAMENT_WEBHOOK_URL` | Endpoint público do observador n8n que recebe os `FilamentAuditEntry`. | Aponta para `http://72.61.216.70:5678/...`; substitua pela URL real do workflow. |

A orquestração completa das chamadas LLM acontece dentro do workflow n8n mencionado anteriormente, então não há uma variável `.env` direta para apontar ao modelo: basta configurar o nó HTTP/Function correspondente na mesma automação que recebe o `FilamentAuditEntry`.

A combinação dessas variáveis permite isolar o sandbox dimensional do ambiente principal, garantir que os hooks apontem para observadores reais (n8n/LLM) e repetir testes com usuários/cursos previsíveis.