---
name: Service Health Check
description: Script to verify service health endpoints after deployment
language: bash
tags: [devops, deployment, monitoring]
---

#!/usr/bin/env bash
# Service Health Check Script
# Usage: ./health-check.sh <base-url> [timeout-seconds]

set -euo pipefail

BASE_URL="${1:?Usage: $0 <base-url> [timeout-seconds]}"
TIMEOUT="${2:-30}"
INTERVAL=2
ELAPSED=0

echo "Checking health at: ${BASE_URL}/health"

while [ "$ELAPSED" -lt "$TIMEOUT" ]; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/health" 2>/dev/null || echo "000")

  if [ "$STATUS" = "200" ]; then
    echo "Service is healthy (HTTP 200) after ${ELAPSED}s"
    exit 0
  fi

  echo "Status: ${STATUS} — retrying in ${INTERVAL}s (${ELAPSED}/${TIMEOUT}s)"
  sleep "$INTERVAL"
  ELAPSED=$((ELAPSED + INTERVAL))
done

echo "ERROR: Service did not become healthy within ${TIMEOUT}s"
exit 1
