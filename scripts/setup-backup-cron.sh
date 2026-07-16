#!/usr/bin/env bash
# Installs a half-hourly cron job for QEMS database backups.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_SCRIPT="$ROOT_DIR/scripts/backup-database.sh"
OLD_CRON_TAG="# qems-hourly-backup"
CRON_TAG="# qems-half-hour-backup"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-2}"
CRON_BACKUP_ROOT="${QEMS_CRON_BACKUP_ROOT:-$HOME/.qems-backups}"
CRON_BACKUP_DIR="$CRON_BACKUP_ROOT/database"
CRON_LOG_FILE="$CRON_BACKUP_ROOT/backup.log"
CRON_RUNNER_LOG="$CRON_BACKUP_ROOT/cron-runner.log"
CRON_LINE="*/30 * * * * BACKUP_DIR=\"$CRON_BACKUP_DIR\" BACKUP_LOG=\"$CRON_LOG_FILE\" BACKUP_RETENTION_DAYS=\"$RETENTION_DAYS\" /bin/bash \"$BACKUP_SCRIPT\" >> \"$CRON_RUNNER_LOG\" 2>&1 $CRON_TAG"

chmod +x "$BACKUP_SCRIPT"

if [ ! -x "$BACKUP_SCRIPT" ]; then
  echo "Backup script not found: $BACKUP_SCRIPT"
  exit 1
fi

mkdir -p "$CRON_BACKUP_DIR"

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
echo "Backups: $CRON_BACKUP_DIR/"
echo "Logs:    $CRON_LOG_FILE"
echo "Cron:    $CRON_RUNNER_LOG"
echo "Retention: $RETENTION_DAYS days (set BACKUP_RETENTION_DAYS before running this installer to change it)"
echo ""
echo "Run a backup now: npm run backup"
