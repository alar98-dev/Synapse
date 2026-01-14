#!/usr/bin/env bash
# scripts/dev_start.sh - Standard Synapse Development Runtime

set -e

# 1. Colors for logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}--- Synapse Development Environment ---${NC}"

# 2. Check Virtual Environment
if [ -d ".venv" ]; then
    echo -e "[OK] Virtual environment found."
    source .venv/bin/activate
else
    echo -e "${GREEN}[INFO] Please create a .venv and install requirements first.${NC}"
fi

# 3. Apply Migrations
echo -e "${BLUE}[1/3] Applying Migrations...${NC}"
python3 manage.py migrate

# 4. Start Backend in background
echo -e "${BLUE}[2/3] Starting Django Backend on http://127.0.0.1:8000...${NC}"
python3 manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!

# 5. Start Frontend
echo -e "${BLUE}[3/3] Starting Frontend (Vite)...${NC}"
python3 frontend.py --host 0.0.0.0 --port 5173

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT
