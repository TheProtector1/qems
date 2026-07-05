#!/usr/bin/env bash
# QEMS hourly database backup — retains backups for BACKUP_RETENTION_DAYS (default 5).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups/database}"
LOG_FILE="${BACKUP_LOG:-$ROOT_DIR/backups/backup.log}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-5}"

mkdir -p "$BACKUP_DIR" "$(dirname "$LOG_FILE")"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# shellcheck source=load-database-url.sh
source "$(dirname "$0")/load-database-url.sh"
# shellcheck source=pg-tools.sh
source "$(dirname "$0")/pg-tools.sh"

PG_DUMP="$(resolve_pg_tool pg_dump)" || {
  log "ERROR: pg_dump not found. Install PostgreSQL client tools (e.g. brew install postgresql@17)."
  exit 1
}

DATABASE_URL="$(load_database_url "$ROOT_DIR")" || {
  log "ERROR: Database URL not found. Set quran_education_DATABASE_URL or DATABASE_URL in .env / GitHub secrets."
  exit 1
}

TIMESTAMP="$(date '+%Y%m%d-%H%M%S')"
BACKUP_FILE="$BACKUP_DIR/qems-${TIMESTAMP}.dump"
DUMP_LOG="$(mktemp)"

log "Starting backup → $BACKUP_FILE (pg_dump: $("$PG_DUMP" --version 2>/dev/null | head -1))"

if "$PG_DUMP" "$DATABASE_URL" --format=custom --no-owner --no-acl --file="$BACKUP_FILE" 2>"$DUMP_LOG"; then
  SIZE="$(du -h "$BACKUP_FILE" | cut -f1)"
  log "Backup completed ($SIZE)"
else
  log "ERROR: pg_dump failed"
  sed 's/^/[pg_dump] /' "$DUMP_LOG" | tee -a "$LOG_FILE" >/dev/null
  rm -f "$BACKUP_FILE"
  rm -f "$DUMP_LOG"
  exit 1
fi
rm -f "$DUMP_LOG"

# Delete backups older than retention period (5 days = 120 hourly snapshots max)
DELETED=0
while IFS= read -r -d '' old; do
  rm -f "$old"
  DELETED=$((DELETED + 1))
done < <(find "$BACKUP_DIR" -type f -name 'qems-*.dump' -mtime +"$RETENTION_DAYS" -print0 2>/dev/null || true)

if [ "$DELETED" -gt 0 ]; then
  log "Pruned $DELETED backup(s) older than ${RETENTION_DAYS} days"
fi

REMAINING="$(find "$BACKUP_DIR" -type f -name 'qems-*.dump' 2>/dev/null | wc -l | tr -d ' ')"
log "Retention OK — $REMAINING backup file(s) on disk"
