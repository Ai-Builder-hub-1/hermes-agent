#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/root/apps/nous-hermes-agent"
LOG_DIR="/var/log/nous-hermes-agent"
LOCK_FILE="/tmp/dashboard-advanced-maturity.lock"
LOG_FILE="$LOG_DIR/dashboard-advanced-maturity.log"

mkdir -p "$LOG_DIR"
cd "$APP_DIR"

{
  echo "[$(date -Is)] dashboard advanced maturity scheduled run starting"
  flock -n 9 || {
    echo "[$(date -Is)] previous dashboard advanced maturity run still active; skipping"
    exit 0
  }
  npm run dashboard:advanced-maturity:refresh
  npm run dashboard:advanced-maturity:validate
  echo "[$(date -Is)] dashboard advanced maturity scheduled run completed"
} 9>"$LOCK_FILE" >>"$LOG_FILE" 2>&1
