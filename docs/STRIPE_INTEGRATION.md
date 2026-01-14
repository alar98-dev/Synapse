# Stripe Integration - Synapse

## Webhook Hardening
O sistema utiliza o segredo de assinatura para validar que as requisições vêm realmente do Stripe.

### Configuração
No arquivo `.env`, configure:
- `STRIPE_SECRET_KEY`: Sua chave secreta do dashboard do Stripe (sk_test_...).
- `STRIPE_WEBHOOK_SECRET`: O segredo obtido ao configurar o endpoint do webhook (whsec_...).

### Endpoint do Webhook
Configure o Stripe para enviar eventos `checkout.session.completed` para:
`https://seu-dominio.com/api/v1/payments/webhook/stripe/`

## Fluxo de Compra
1. O frontend chama `/api/v1/payments/payments/create_checkout_session/` enviando `course_id`.
2. O backend cria um objeto `Payment` com status `pending`.
3. O backend retorna a URL do Checkout do Stripe.
4. O aluno completa o pagamento no Stripe.
5. O Stripe envia um webhook para o backend.
6. O backend valida a assinatura, marca o `Payment` como `completed` e cria um `Enrollment` (Inscrição) para o aluno no curso.
