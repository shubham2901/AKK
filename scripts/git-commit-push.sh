#!/usr/bin/env bash
# Stage all changes, commit with the given message, push current branch.
# Usage: bash scripts/git-commit-push.sh "your commit message"
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <commit message>" >&2
  echo 'Example: '"$0"' "fix: filter bar layout"' >&2
  exit 1
fi

MSG="$*"

if [[ -z "$(git status --porcelain 2>/dev/null)" ]]; then
  echo "Nothing to commit (working tree clean)." >&2
  exit 0
fi

git add -A
git commit -m "$MSG"
git push
