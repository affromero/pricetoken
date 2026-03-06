#!/bin/bash
# Run all pricing crons sequentially to avoid OOM from parallel runs.
# Intended for server-side crontab: 0 6 * * * /home/sotto/pricetoken/scripts/run-all-crons.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load CRON_SECRET from .env
if [ -f "$PROJECT_DIR/.env" ]; then
  CRON_SECRET=$(grep '^CRON_SECRET=' "$PROJECT_DIR/.env" | cut -d= -f2)
else
  echo "ERROR: .env file not found at $PROJECT_DIR/.env"
  exit 1
fi

if [ -z "$CRON_SECRET" ]; then
  echo "ERROR: CRON_SECRET not found in .env"
  exit 1
fi

BASE_URL="http://localhost:3001"
AUTH_HEADER="Authorization: Bearer $CRON_SECRET"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

run_cron() {
  local name="$1"
  local endpoint="$2"
  local timeout="${3:-600}"

  log "Starting $name cron..."
  local start_time=$(date +%s)

  HTTP_CODE=$(curl -sf --max-time "$timeout" -o /dev/null -w '%{http_code}' \
    "$BASE_URL$endpoint" \
    -H "$AUTH_HEADER" 2>&1) || HTTP_CODE="timeout"

  local end_time=$(date +%s)
  local duration=$((end_time - start_time))

  if [ "$HTTP_CODE" = "200" ]; then
    log "$name completed successfully (${duration}s)"
  else
    log "WARNING: $name returned $HTTP_CODE (${duration}s)"
  fi
}

log "=== Starting sequential pricing fetch ==="

run_cron "Text pricing"  "/api/cron/fetch-pricing"       600
run_cron "Image pricing" "/api/cron/fetch-image-pricing"  600
run_cron "Video pricing"  "/api/cron/fetch-video-pricing"  600
run_cron "Avatar pricing" "/api/cron/fetch-avatar-pricing" 600

log "=== All crons complete ==="
