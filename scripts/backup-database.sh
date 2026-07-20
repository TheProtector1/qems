#!/usr/bin/env bash
# QEMS database backup — intended for 30-minute scheduling.
# Retains the last BACKUP_RETENTION_DAYS days of backups (default 2).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups/database}"
LOG_FILE="${BACKUP_LOG:-$ROOT_DIR/backups/backup.log}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-2}"

mkdir -p "$BACKUP_DIR" "$(dirname "$LOG_FILE")"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Portable lock (macOS has no flock). Uses mkdir atomic create.
LOCK_DIR="${BACKUP_LOCK_DIR:-$BACKUP_DIR/.backup.lockdir}"
acquire_lock() {
  if mkdir "$LOCK_DIR" 2>/dev/null; then
    return 0
  fi

  # Clear stale locks older than 60 minutes.
  if [ -d "$LOCK_DIR" ]; then
    local age_minutes
    age_minutes="$(( ( $(date +%s) - $(stat -f %m "$LOCK_DIR" 2>/dev/null || echo 0) ) / 60 ))"
    if [ "$age_minutes" -ge 60 ]; then
      rmdir "$LOCK_DIR" 2>/dev/null || rm -rf "$LOCK_DIR"
      if mkdir "$LOCK_DIR" 2>/dev/null; then
        return 0
      fi
    fi
  fi
  return 1
}

if ! acquire_lock; then
  log "Backup already running — skipping this tick"
  exit 0
fi

release_lock() {
  rmdir "$LOCK_DIR" 2>/dev/null || true
}
is_positive_int() {
  case "${1:-}" in
    ""|*[!0-9]*) return 1 ;;
    *) [ "$1" -gt 0 ] ;;
  esac
}

if ! is_positive_int "$RETENTION_DAYS"; then
  log "ERROR: BACKUP_RETENTION_DAYS must be a positive whole number; got '$RETENTION_DAYS'"
  exit 1
fi

RETENTION_MINUTES="${BACKUP_RETENTION_MINUTES:-$((RETENTION_DAYS * 24 * 60))}"
if ! is_positive_int "$RETENTION_MINUTES"; then
  log "ERROR: BACKUP_RETENTION_MINUTES must be a positive whole number; got '$RETENTION_MINUTES'"
  exit 1
fi

# shellcheck source=load-database-url.sh
source "$(dirname "$0")/load-database-url.sh"
# shellcheck source=pg-tools.sh
source "$(dirname "$0")/pg-tools.sh"

PG_DUMP="$(resolve_pg_tool pg_dump)" || {
  log "ERROR: pg_dump not found. Install PostgreSQL client tools (e.g. brew install postgresql@17)."
  exit 1
}

PG_RESTORE="$(resolve_pg_tool pg_restore)" || {
  log "ERROR: pg_restore not found. Install PostgreSQL client tools (e.g. brew install postgresql@17)."
  exit 1
}

DATABASE_URL="$(load_database_url "$ROOT_DIR")" || {
  log "ERROR: Database URL not found. Set quran_education_DATABASE_URL or DATABASE_URL in .env / GitHub secrets."
  exit 1
}

TIMESTAMP="$(date '+%Y%m%d-%H%M%S')"
BACKUP_FILE="$BACKUP_DIR/qems-${TIMESTAMP}.dump"
# macOS mktemp requires the XXXXXX suffix at the end of the template.
TMP_BACKUP_FILE="$(mktemp "$BACKUP_DIR/.qems-${TIMESTAMP}.XXXXXX")"
DUMP_LOG="$(mktemp)"

cleanup_tmp() {
  rm -f "$TMP_BACKUP_FILE" "$DUMP_LOG"
  release_lock
}
trap cleanup_tmp EXIT

log "Starting backup -> $BACKUP_FILE (pg_dump: $("$PG_DUMP" --version 2>/dev/null | head -1))"

if ! "$PG_DUMP" "$DATABASE_URL" --format=custom --no-owner --no-acl --file="$TMP_BACKUP_FILE" 2>"$DUMP_LOG"; then
  log "ERROR: pg_dump failed"
  sed 's/^/[pg_dump] /' "$DUMP_LOG" | tee -a "$LOG_FILE" >/dev/null
  exit 1
fi

if [ ! -s "$TMP_BACKUP_FILE" ]; then
  log "ERROR: pg_dump produced an empty backup file"
  exit 1
fi

if ! "$PG_RESTORE" --list "$TMP_BACKUP_FILE" >/dev/null 2>>"$DUMP_LOG"; then
  log "ERROR: backup verification failed; pg_restore could not read the dump"
  sed 's/^/[pg_restore] /' "$DUMP_LOG" | tee -a "$LOG_FILE" >/dev/null
  exit 1
fi

mv "$TMP_BACKUP_FILE" "$BACKUP_FILE"
SIZE="$(du -h "$BACKUP_FILE" | cut -f1)"
log "Backup completed and verified ($SIZE)"

# Delete backups older than the retention window (default 2 days = 48 half-hour snapshots).
DELETED=0
while IFS= read -r -d '' old; do
  rm -f "$old"
  DELETED=$((DELETED + 1))
done < <(find "$BACKUP_DIR" -type f -name 'qems-*.dump' -mmin +"$RETENTION_MINUTES" -print0 2>/dev/null || true)

if [ "$DELETED" -gt 0 ]; then
  log "Pruned $DELETED backup(s) older than ${RETENTION_DAYS} day(s)"
fi

REMAINING="$(find "$BACKUP_DIR" -type f -name 'qems-*.dump' 2>/dev/null | wc -l | tr -d ' ')"
log "Retention OK - $REMAINING backup file(s) on disk"
