#!/usr/bin/env bash
# scripts/test_all.sh - Run all tests (Unit & Integration)

set -e

source .venv/bin/activate

echo ">>> [1/2] Running Unit/Mock Tests (SQLite Memory)..."
python3 -m pytest tests/test_routes.py tests/test_login.py

echo ">>> [2/2] Running Integration Tests..."
# Note: Integration tests require the server to be running at INTEGRATION_BASE_URL
# We skip them if the pre-check fails
if python3 scripts/pre_check_integration.py; then
    echo "Ambiente pronto. Rodando testes de integração..."
    python3 -m pytest tests/integration/
else
    echo "AVISO: Pré-check de integração falhou. Pulando testes reais (E2E)."
    echo "Certifique-se que o banco de dados e o servidor estão UP."
fi
