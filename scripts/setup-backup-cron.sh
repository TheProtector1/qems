#!/usr/bin/env bash
# Installs an hourly cron job for QEMS database backups.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_SCRIPT="$ROOT_DIR/scripts/backup-database.sh"
CRON_TAG="# qems-hourly-backup"
CRON_LINE="0 * * * * cd $ROOT_DIR && /bin/bash $BACKUP_SCRIPT >> $ROOT_DIR/backups/backup.log 2>&1 $CRON_TAG"

chmod +x "$BACKUP_SCRIPT"

if [ ! -x "$BACKUP_SCRIPT" ]; then
  echo "Backup script not found: $BACKUP_SCRIPT"
  exit 1
fi

mkdir -p "$ROOT_DIR/backups"

CURRENT="$(crontab -l 2>/dev/null || true)"
if echo "$CURRENT" | grep -q "$CRON_TAG"; then
  echo "Hourly backup cron already installed."
  echo "$CURRENT" | grep "$CRON_TAG"
  exit 0
fi

{
  echo "$CURRENT"
  echo "$CRON_LINE"
} | crontab -

echo "Installed hourly backup cron:"
echo "  $CRON_LINE"
echo ""
echo "Backups: $ROOT_DIR/backups/database/"
echo "Logs:    $ROOT_DIR/backups/backup.log"
echo "Retention: ${BACKUP_RETENTION_DAYS:-5} days (set BACKUP_RETENTION_DAYS in env or .env)"
echo ""
echo "Run a backup now: npm run backup"
