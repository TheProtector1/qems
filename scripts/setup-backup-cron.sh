#!/usr/bin/env bash
# Installs a half-hourly cron job for QEMS database backups.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_SCRIPT="$ROOT_DIR/scripts/backup-database.sh"
OLD_CRON_TAG="# qems-hourly-backup"
CRON_TAG="# qems-half-hour-backup"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-2}"
CRON_LINE="*/30 * * * * cd \"$ROOT_DIR\" && BACKUP_RETENTION_DAYS=\"$RETENTION_DAYS\" /bin/bash \"$BACKUP_SCRIPT\" >> \"$ROOT_DIR/backups/backup.log\" 2>&1 $CRON_TAG"

chmod +x "$BACKUP_SCRIPT"

if [ ! -x "$BACKUP_SCRIPT" ]; then
  echo "Backup script not found: $BACKUP_SCRIPT"
  exit 1
fi

mkdir -p "$ROOT_DIR/backups"

CURRENT="$(crontab -l 2>/dev/null || true)"
FILTERED="$(
  printf '%s\n' "$CURRENT" \
    | grep -vF "$CRON_TAG" \
    | grep -vF "$OLD_CRON_TAG" \
    || true
)"

{
  printf '%s\n' "$FILTERED"
  printf '%s\n' "$CRON_LINE"
} | crontab -

echo "Installed half-hourly backup cron:"
echo "  $CRON_LINE"
echo ""
echo "Backups: $ROOT_DIR/backups/database/"
echo "Logs:    $ROOT_DIR/backups/backup.log"
echo "Retention: $RETENTION_DAYS days (set BACKUP_RETENTION_DAYS before running this installer to change it)"
echo ""
echo "Run a backup now: npm run backup"
