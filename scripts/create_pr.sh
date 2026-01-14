#!/usr/bin/env bash
# Helper to create a branch, commit files and open a PR using gh (GitHub CLI).
# Usage: ./scripts/create_pr.sh <branch-name> "PR title" "PR body"
set -euo pipefail
BRANCH=$1
TITLE=$2
BODY=$3

git checkout -b "$BRANCH"
# stage any local changes before running script
git add -A
git commit -m "chore: start $BRANCH" || true

echo "Pushing branch $BRANCH..."
git push --set-upstream origin "$BRANCH"

if command -v gh >/dev/null 2>&1; then
  gh pr create --title "$TITLE" --body "$BODY" --base main
else
  echo "Install gh CLI to open PR automatically: https://cli.github.com/"
  echo "Or open PR manually at: https://github.com/<owner>/<repo>/compare" 
fi
