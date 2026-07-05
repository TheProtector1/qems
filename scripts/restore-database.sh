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

# shellcheck source=load-database-url.sh
source "$(dirname "$0")/load-database-url.sh"
# shellcheck source=pg-tools.sh
source "$(dirname "$0")/pg-tools.sh"

PG_RESTORE="$(resolve_pg_tool pg_restore)" || {
  echo "ERROR: pg_restore not found. Install PostgreSQL client tools (e.g. brew install postgresql@17)."
  exit 1
}

DATABASE_URL="$(load_database_url "$ROOT_DIR")" || {
  echo "ERROR: Database URL not found. Set quran_education_DATABASE_URL or DATABASE_URL in .env"
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
