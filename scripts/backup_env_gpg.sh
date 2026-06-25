#!/usr/bin/env bash
# Create a GPG-encrypted backup of .env in scripts/backups/.env.YYYYMMDD_HHMMSS.gpg
# Usage: backup_env_gpg.sh [--recipient KEY_ID] [--symmetric]
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
BACKUP_DIR="$ROOT_DIR/scripts/backups"
mkdir -p "$BACKUP_DIR"
if [ ! -f "$ENV_FILE" ]; then
  echo ".env not found at $ENV_FILE" >&2
  exit 1
fi
TS=$(date +"%Y%m%d_%H%M%S")
OUT="$BACKUP_DIR/.env.$TS.gpg"
# Determine encryption method
if [ "${1-}" = "--recipient" ]; then
  RECIPIENT="$2"
  gpg --yes --output "$OUT" --encrypt --recipient "$RECIPIENT" "$ENV_FILE"
elif [ "${1-}" = "--symmetric" ]; then
  # Symmetric: will prompt for passphrase
  gpg --yes --output "$OUT" --symmetric "$ENV_FILE"
elif [ -n "${GPG_RECIPIENT-}" ]; then
  gpg --yes --output "$OUT" --encrypt --recipient "$GPG_RECIPIENT" "$ENV_FILE"
else
  # default to symmetric if no recipient provided
  gpg --yes --output "$OUT" --symmetric "$ENV_FILE"
fi
chmod 600 "$OUT"
 echo "Backed up (encrypted) $ENV_FILE -> $OUT"
