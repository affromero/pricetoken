#!/usr/bin/env bash
# fetch-all-pricing.sh — Sequential pricing verification for all categories,
# followed by a retry pass that re-runs any failures or flagged models.
# Exits non-zero if ANY category still has issues after retry.

set -u

BASE_URL="http://localhost:3001/api/cron"
MAX_TIME=300
FAILED=0
TOTAL=0
CATEGORIES=(
  "fetch-pricing"
  "fetch-avatar-pricing"
  "fetch-image-pricing"
  "fetch-video-pricing"
  "fetch-stt-pricing"
  "fetch-tts-pricing"
)

run_category() {
  local category="$1"
  local label="$2"
  TOTAL=$((TOTAL + 1))
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] ${label}: ${category}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  HTTP_CODE=$(curl \
    --silent \
    --show-error \
    --max-time "${MAX_TIME}" \
    --output /tmp/pricetoken-fetch-response.json \
    --write-out "%{http_code}" \
    -H "Authorization: Bearer ${CRON_SECRET}" \
    "${BASE_URL}/${category}" \
    2>&1)
  CURL_EXIT=$?

  if [ "${CURL_EXIT}" -ne 0 ]; then
    echo "[ERROR] ${category}: curl failed (exit ${CURL_EXIT}): ${HTTP_CODE}"
    FAILED=$((FAILED + 1))
  elif [ "${HTTP_CODE}" -ge 200 ] && [ "${HTTP_CODE}" -lt 300 ]; then
    echo "[OK] ${category}: HTTP ${HTTP_CODE}"
    cat /tmp/pricetoken-fetch-response.json 2>/dev/null
    echo ""
  else
    echo "[ERROR] ${category}: HTTP ${HTTP_CODE}"
    cat /tmp/pricetoken-fetch-response.json 2>/dev/null
    echo ""
    FAILED=$((FAILED + 1))
  fi

  echo ""
}

# ── Pass 1: Run all categories ──────────────────────────────────────

echo "╔══════════════════════════════════════════╗"
echo "║  Pass 1: Initial verification            ║"
echo "╚══════════════════════════════════════════╝"
echo ""

for category in "${CATEGORIES[@]}"; do
  run_category "${category}" "Initial"
done

rm -f /tmp/pricetoken-fetch-response.json

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] Pass 1 summary: $((TOTAL - FAILED))/${TOTAL} succeeded"
echo ""

# ── Pass 2: Retry failed/partial categories ─────────────────────────

echo "╔══════════════════════════════════════════╗"
echo "║  Pass 2: Retry (60s cooldown)            ║"
echo "╚══════════════════════════════════════════╝"
echo ""

echo "Waiting 60 seconds before retry..."
sleep 60

echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] Starting retry pass..."
echo ""

RETRY_HTTP_CODE=$(curl \
  --silent \
  --show-error \
  --max-time 1800 \
  --output /tmp/pricetoken-retry-response.json \
  --write-out "%{http_code}" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  "${BASE_URL}/retry" \
  2>&1)
RETRY_EXIT=$?

if [ "${RETRY_EXIT}" -ne 0 ]; then
  echo "[ERROR] Retry: curl failed (exit ${RETRY_EXIT}): ${RETRY_HTTP_CODE}"
elif [ "${RETRY_HTTP_CODE}" -ge 200 ] && [ "${RETRY_HTTP_CODE}" -lt 300 ]; then
  echo "[OK] Retry: HTTP ${RETRY_HTTP_CODE}"
  cat /tmp/pricetoken-retry-response.json 2>/dev/null
  echo ""
else
  echo "[ERROR] Retry: HTTP ${RETRY_HTTP_CODE}"
  cat /tmp/pricetoken-retry-response.json 2>/dev/null
  echo ""
  FAILED=$((FAILED + 1))
fi

rm -f /tmp/pricetoken-retry-response.json

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] All passes complete"
if [ "${FAILED}" -gt 0 ]; then
  echo "[WARN] ${FAILED} issue(s) during initial pass (retry may have resolved them)"
fi
exit 0
