#!/usr/bin/env bash
set -euo pipefail

# Start script that kills any process listening on $PORT and starts the server.
# Default port: 3000

# Resolve script directory so the script can be invoked from any cwd
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

PORT="${PORT:-3000}"

# Allow passing default site as first arg or via DEFAULT_SITE env var
# Usage: DEFAULT_SITE=stone-realestate ./scripts/start-3000.sh OR ./scripts/start-3000.sh stone-realestate
DEFAULT_SITE="${DEFAULT_SITE:-${1:-}}"
export DEFAULT_SITE

if [ -n "$DEFAULT_SITE" ]; then
  echo "Starting with DEFAULT_SITE=$DEFAULT_SITE"
fi

# Check if lsof exists
if ! command -v lsof >/dev/null 2>&1; then
  echo "lsof is required but not installed. Please install lsof (apt install lsof)" >&2
  exit 1
fi

# Find and kill processes on port
PIDS=$(lsof -ti "tcp:$PORT" || true)
if [ -n "$PIDS" ]; then
  echo "Killing processes on port $PORT: $PIDS"
  # Attempt to kill gracefully, then force
  for pid in $PIDS; do
    kill -TERM $pid || true
  done
  sleep 0.5
  PIDS_REMAIN=$(lsof -ti "tcp:$PORT" || true)
  if [ -n "$PIDS_REMAIN" ]; then
    echo "Forcing kill of lingering pids: $PIDS_REMAIN"
    echo $PIDS_REMAIN | xargs -r kill -9 || true
  fi
fi

echo "Starting server on port $PORT (project root: $PROJECT_ROOT)"
export PORT
# Use the project-root absolute path to start server so the script works from any cwd
node "$PROJECT_ROOT/server.js"
