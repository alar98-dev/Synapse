#!/usr/bin/env bash
set -euo pipefail

# Script to run pytest inside the web container and export reports to ./test_reports
# Usage: ./scripts/run_tests.sh

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT_DIR"

mkdir -p test_reports

echo "Building Docker image..."
docker-compose build web

echo "Running migrations in a temporary container..."
docker-compose run --rm web python manage.py migrate --noinput

echo "Running pytest inside web container..."
# Run pytest and generate junit xml and coverage report into /test_reports
docker-compose run --rm -e PYTEST_ADDOPTS="--junitxml=/test_reports/junit.xml --cov=./ --cov-report=xml:/test_reports/coverage.xml" web pytest -q

EXIT_CODE=$?
echo "Tests finished with exit code $EXIT_CODE"
echo "Reports available in ./test_reports"
exit $EXIT_CODE
