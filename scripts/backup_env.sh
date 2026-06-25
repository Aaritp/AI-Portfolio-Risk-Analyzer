#!/usr/bin/env bash
# Backup .env to scripts/backups/.env.YYYYMMDD_HHMMSS
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
BACKUP_DIR="$ROOT_DIR/scripts/backups"
mkdir -p "$BACKUP_DIR"
if [ ! -f "$ENV_FILE" ]; then
  echo ".env not found at $ENV_FILE"
  exit 1
fi
TS=$(date +"%Y%m%d_%H%M%S")
BACKUP="$BACKUP_DIR/.env.$TS"
cp -- "$ENV_FILE" "$BACKUP"
chmod 600 "$BACKUP"
echo "Backed up $ENV_FILE -> $BACKUP"
