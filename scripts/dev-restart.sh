#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PORT="${PORT:-3000}"
export PORT

PIDS="$(lsof -t -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
if [ -n "$PIDS" ]; then
  echo "Freeing port $PORT (PIDs: $(echo "$PIDS" | tr '\n' ' '))"
  for pid in $PIDS; do
    [ -n "$pid" ] && kill -9 "$pid" 2>/dev/null || true
  done
  sleep 0.4
fi

exec npm run dev
