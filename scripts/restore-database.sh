#!/usr/bin/env bash
# Restore QEMS database from a pg_dump custom-format backup file.
# Usage: ./scripts/restore-database.sh backups/database/qems-YYYYMMDD-HHMMSS.dump
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <backup-file.dump>"
  exit 1
fi

BACKUP_FILE="$1"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

# shellcheck source=pg-tools.sh
source "$(dirname "$0")/pg-tools.sh"

PG_RESTORE="$(resolve_pg_tool pg_restore)" || {
  echo "ERROR: pg_restore not found. Install PostgreSQL client tools (e.g. brew install postgresql@17)."
  exit 1
}

load_database_url() {
  local f val
  for f in "$ROOT_DIR/.env.local" "$ROOT_DIR/.env"; do
    if [ -f "$f" ]; then
      val="$(grep -E '^(quran_education_DATABASE_URL|DATABASE_URL)=' "$f" | tail -n 1 | cut -d= -f2- | sed 's/^["'\'']//;s/["'\'']$//' || true)"
      if [ -n "$val" ]; then
        printf '%s' "$val"
        return 0
      fi
    fi
  done
  return 1
}

DATABASE_URL="$(load_database_url)" || {
  echo "ERROR: Database URL not found in .env"
  exit 1
}

echo "WARNING: This will restore into the database from:"
echo "  $BACKUP_FILE"
echo ""
read -r -p "Type RESTORE to continue: " confirm
if [ "$confirm" != "RESTORE" ]; then
  echo "Aborted."
  exit 1
fi

"$PG_RESTORE" --clean --if-exists --no-owner --no-acl --dbname="$DATABASE_URL" "$BACKUP_FILE"
echo "Restore completed."
