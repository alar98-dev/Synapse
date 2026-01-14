# Planejamento — Assinaturas (Billing)

## Resumo do Módulo (padrão)

| Campo | Descrição |
| --- | --- |
| Módulo | Assinaturas / Billing |
| Elementos críticos | Plan Cards; CTAs (Upgrade/Cancel/Renew); Receipts/Export; Plan limits & benefits; BillingOverview route |
| Lacuna | View isolada sem ações de gerenciamento; Falta associação clara entre planos e limites; Falta rastreabilidade e eventos S1a detalhados; Webhooks/endpoints incompletos |
| Sugestão | Implement `/payments/subscriptions/`, `/payments/receipts/`; expose `plan_limits` in API; BillingOverview UI in sidebar with badges; emit S1a/S3/S4 for billing actions; microtests UX (FE/BE/QA) |
| Responsabilidade | Backend / Frontend / Payments / QA |
| Impacto | Aumento na conversão de upgrades; redução do churn; incremento de ARPU |
| KPI | Upgrade conversion rate; churn rate; ARPU |
| Prioridade | Média→Alta |
| Telemetria | S1a: `s1a.billing.action.v1` {user_id, plan_id, action, source, correlation_id}; S3: payment events (amount, invoice_id); S4: receipts export/download |

**Resumo:** Integrar Billing ao produto para permitir gestão completa de assinaturas (upgrade, cancel, históricos de pagamento), visibilidade clara de limites e benefícios por plano, e rastreabilidade das ações financeiras.

> Nota: Todos os eventos emitidos por este módulo devem incluir `correlation_id`. Preencher o campo `Responsabilidade` com nome/alias do owner antes de mover para sprint.

---

## 1) Elementos críticos ✅
- **Cards de plano / assinatura** (status: ativo, expirado, trial, cancelado, pendente)
- **CTA principal:** Upgrade / Cancel / Renovar / Gerenciar pagamento
- **Botão:** "Ver recibos / Faturas" com opção de download (PDF/CSV)
- **Limites e benefícios por plano:** tokens AI, número de cursos privados, número de colaboradores/usuários, quotas de API, acesso a features (ex.: analytics avançado)
- **Área de navegação para Billing:** link na sidebar + badge de plano atual com alerta de expiração
- **Mensagens de erro / estado:** falha de pagamento, plano expirado, falta de autorização (401/403), conflito (409)
- **Histórico de subscrições e pagamentos:** listagem de recibos, métodos de pagamento, status de reembolsos
- **Feedback visual:** skeletons/spinner em ações, toasts de sucesso/erro, confirmations modals para ações destrutivas
- **Rastreabilidade / Telemetria:** todos os CTAs e eventos críticos emitindo S1a/S3/S4 com propriedades suficientes

## 2) Diagnóstico — lacunas críticas ⚠️
- View atual é isolada e sem ações de gerenciamento (não dá para iniciar upgrade/cancel direto)
- Falta associação clara entre planos e **limites/benefícios** no produto (usuários não entendem o que compram)
- Falta de rastreabilidade dos cliques em CTAs e dos resultados (não há eventos S1a detalhados)
- Feedback insuficiente sobre erros (ex.: quando upgrade falha por cartão, retry invisível)
- Navegação pobre entre produto e billing (breadcrumbs / context) — confunde usuários que tentam mapear limites às features
- Falta de endpoints e webhooks documentados para ações de billing e integração com gateway

## 3) Sugestões de melhoria ✨
- **Integrar Billing na sidebar** com badge do plano atual e CTA visível para Upgrade
- **Exibir relação entre plano e limites** (ex.: tokens AI restantes, cursos privados disponíveis) com tooltips e links para docs
- **Adicionar ações inline:** Upgrade, Cancel, Trocar método de pagamento, Ver recibos
- **Garantir rastreabilidade:** emitir eventos S1a em cliques (com plan_id, source, action) e S3/S4 para uso/faturas
- **Feedback visual robusto:** skeleton loading, progress indicators, toast/alert com instruções de next steps
- **Documentar endpoints e flows:** `/payments/subscriptions/`, `/payments/receipts/`, `/payments/checkout/`, webhooks para `invoice.paid`, `invoice.failed`
- **UX microtestes:** testar clareza do plano, entendimento de limites, e taxa de conversão do fluxo de upgrade

## 4) Plano de implementação 🔧
1. Backend
   - Implementar/explicitar endpoints:
     - `GET /payments/subscriptions/` (status e plano atual)
     - `POST /payments/subscriptions/upgrade` (iniciar upgrade)
     - `POST /payments/subscriptions/cancel` (cancelar com opção de cancel_at_period_end)
     - `GET /payments/receipts/` (listar recibos)
     - `GET /payments/receipts/:id/download` (PDF/CSV)
   - Autenticação via JWT/OAuth e autorização RBAC
   - Eventos e webhooks (gateway): processar `invoice.paid`, `invoice.failed`, `subscription.updated`
   - Mapear planos para limites e expor um objeto `plan_limits` na API
2. Frontend
   - Nova rota/section: `/billing` (integrada ao sidebar)
   - Componentes: `PlanCard`, `BillingOverview`, `ReceiptsList`, `UpgradeModal`, `PaymentMethods`
   - UX details: badges, tooltips com limites, skeletons para carregamento, toasts para sucesso/falha
   - Emitir telemetria (S1a/S3/S4) com propriedades mínimas: `user_id`, `plan_id`, `action`, `source`, `timestamp`
3. UX & Product
   - Microtestes A/B no copy do CTA (ex.: "Atualizar plano" vs "Obter +tokens")
   - Mensagens claras sobre o que muda ao migrar de plano (benefícios e limites)
4. QA / Testes
   - Fluxo sem assinatura, com assinatura ativa, com cartão expirado
   - Testar respostas 401/403/409 e mensagens visíveis ao usuário
   - Validar emissões de eventos S1a/S3/S4

## 5) Critérios de validação ✅
- Usuário consegue iniciar upgrade/cancel em **≤ 3 passos**
- **Badge** e **limites** do plano exibidos corretamente no `BillingOverview`
- Eventos **S1a** emitidos nos cliques de `Upgrade`/`Cancel`/`Ver recibo` com propriedades corretas
- Mensagens de erro claras, retry funcional e instruções para suporte
- Recebíveis exportáveis (PDF/CSV) funcionais e listáveis

## 6) Impacto esperado nos KPIs 📈
- **Aumento na conversão de upgrades** (mais CTAs visíveis e fluxo simplificado)
- **Redução no churn** por falta de clareza sobre limites e renovação
- **Aumento do ARPU** por mapeamento de limites e cross-sell de features pagas
- **Melhora na rastreabilidade de ações financeiras**, facilitando análises de funnel e atribuição

## 7) Prioridade 🎯
- **Média → Alta** (priorizar se os planos pagos impactarem diretamente receita; se o produto monetiza fortemente por assinatura, marcar **Alta**)

## 8) Telemetria sugerida (especificação) 🔍
| Evento | Descrição | Propriedades mínimas |
|---|---:|---|
| **S1a** | Clique em ações de billing (Upgrade, Cancel, Renovar) | `user_id`, `plan_id`, `action`, `source`, `page`, `timestamp` |
| **S3** | Eventos de billing / uso (ex.: cobrança, tokens consumidos) | `user_id`, `plan_id`, `amount`, `currency`, `usage`, `invoice_id` |
| **S4** | Exportação de recibos ou histórico (download) | `user_id`, `format` (pdf/csv), `receipt_id`, `timestamp` |

> Observação: padronizar `source` (ex.: `sidebar`, `settings_billing`, `course_page`) e `action` (`upgrade_click`, `cancel_confirm`, `receipt_download`)

## 9) Tickets sugeridos 🧾
- [ ] **FEAT:** Integrar Billing no sidebar com `BillingOverview` e badge de plano atual
- [ ] **FEAT:** Implementar endpoints `/payments/subscriptions/` e `/payments/receipts/` + webhooks
- [ ] **ENH:** Mapear planos para limites do produto (`plan_limits`) e exibir no UI
- [ ] **FEAT:** UI de "Ver recibos" com download PDF/CSV e filtragem por período
- [ ] **FEAT:** Fluxo de Upgrade (modal + checkout + confirmação) com telemetria S1a
- [ ] **QA:** Testar fluxos de upgrade/cancel, erros (401/403), cartões expirados e emissões S1a/S3/S4
- [ ] **DOC:** Atualizar documentação interna e `docs/planning/08-billing.md` com o design final

---

**Notas finais:** priorizar trabalho que desbloqueie ganho de receita (ex.: upgrade rápido) e garantir telemetria completa desde a primeira iteração para medir impacto e iterar rapidamente.

---

## Apêndice — Exemplos de payloads e testes 🧪
Abaixo estão exemplos práticos (cURL / JSON) e snippets de testes (pytest / Django) para acelerar a implementação e cobertura de QA.

### Exemplos de payloads
- GET /payments/subscriptions/ (response)

```json
{
  "user_id": 42,
  "plan": {
    "id": "pro_monthly",
    "name": "Pro",
    "status": "active",
    "current_period_end": "2026-02-14T00:00:00Z",
    "plan_limits": {
      "tokens_monthly": 100000,
      "courses_private": 10,
      "users": 5
    }
  }
}
```

- POST /payments/subscriptions/upgrade (request)

```json
{
  "from_plan_id": "starter",
  "to_plan_id": "pro_monthly",
  "coupon": "SUMMER10",      
  "payment_method_id": "pm_123"
}
```

- POST /payments/subscriptions/cancel (request)

```json
{
  "subscription_id": "sub_abc123",
  "cancel_at_period_end": true
}
```

- GET /payments/receipts/:id/download (example cURL)

```bash
curl -X GET "http://localhost:8000/api/v1/payments/receipts/rcpt_2026-001/download" \
  -H "Authorization: Bearer <JWT>" \
  -H "Accept: application/pdf" --output receipt-rcpt_2026-001.pdf
```

- Webhook sample (invoice.failed)

```json
{
  "type": "invoice.failed",
  "data": {
    "object": {
      "id": "in_2026_01",
      "user_id": 42,
      "amount_due": 5000,
      "currency": "BRL",
      "status": "failed",
      "attempts": 3
    }
  }
}
```

### Snippets de testes (pytest / Django)
- Testes de API (ex.: `tests/test_billing_api.py`)

```python
import pytest
from rest_framework.test import APIClient

@pytest.fixture
def api_client():
    return APIClient()

def test_get_subscriptions_requires_auth(api_client):
    res = api_client.get('/api/v1/payments/subscriptions/')
    assert res.status_code == 401

def test_get_subscriptions_returns_plan(api_client, django_user_model):
    user = django_user_model.objects.create_user('u', password='p')
    api_client.force_authenticate(user=user)
    res = api_client.get('/api/v1/payments/subscriptions/')
    assert res.status_code == 200
    assert 'plan' in res.json()

def test_post_upgrade_starts_checkout(api_client, django_user_model, mocker):
    user = django_user_model.objects.create_user('u2', password='p')
    api_client.force_authenticate(user=user)
    payload = {"from_plan_id": "starter", "to_plan_id": "pro_monthly"}
    res = api_client.post('/api/v1/payments/subscriptions/upgrade', payload, format='json')
    assert res.status_code in (200, 201)
    assert 'checkout_id' in res.json() or res.json().get('status') == 'processing'

def test_post_cancel_sets_cancel_at_period_end(api_client, django_user_model):
    user = django_user_model.objects.create_user('u3', password='p')
    api_client.force_authenticate(user=user)
    payload = {"subscription_id": "sub_test", "cancel_at_period_end": True}
    res = api_client.post('/api/v1/payments/subscriptions/cancel', payload, format='json')
    assert res.status_code == 200
    assert res.json().get('cancel_at_period_end') is True

# Webhook tests
def test_webhook_invoice_failed_marks_invoice_and_emits_event(client, settings, mocker):
    payload = {"type": "invoice.failed", "data": {"object": {"id": "in_test", "user_id": 1, "status": "failed"}}}
    # mock telemetry emission
    telemetry = mocker.patch('payments.telemetry.emit')
    res = client.post('/api/v1/payments/webhook/', payload, content_type='application/json')
    assert res.status_code == 200
    telemetry.assert_any_call('invoice_failed', mocker.ANY)
```

> Dica: incluir testes que validam que eventos **S3/S4** são emitidos pelo backend (mock do client de telemetria) e que **S1a** é emitido pelo frontend em cliques críticos.

---

**Checksum / Atualização de docs:** adicionar referência rápida no `README.md` com exemplos e link para este planejamento e para o OpenAPI gerado (`/api/v1/docs/`).