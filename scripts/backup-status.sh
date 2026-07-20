#!/usr/bin/env bash
# Show QEMS backup scheduler health (launchd + latest dumps + recent log lines).
set -euo pipefail

INSTALL_ROOT="${QEMS_BACKUP_HOME:-$HOME/.qems-backups}"
PLIST_LABEL="io.qems.database-backup"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_LABEL}.plist"
DB_DIR="$INSTALL_ROOT/database"
LOG_FILE="$INSTALL_ROOT/logs/backup.log"

echo "=== QEMS backup status ==="
echo "Time: $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo ""

if [ -f "$PLIST_PATH" ]; then
  echo "launchd plist: installed ($PLIST_PATH)"
else
  echo "launchd plist: MISSING — run: npm run backup:install"
fi

if launchctl print "gui/$(id -u)/$PLIST_LABEL" >/dev/null 2>&1; then
  echo "launchd agent: LOADED"
  launchctl print "gui/$(id -u)/$PLIST_LABEL" 2>/dev/null | awk '
    /state =/ || /runs =/ || /last exit code/ || /next run/ || /interval/ { print "  " $0 }
  '
else
  echo "launchd agent: NOT LOADED — run: npm run backup:install"
fi

echo ""
if crontab -l 2>/dev/null | grep -q 'qems-.*backup\|Downloads/QEMS/scripts/backup-database'; then
  echo "cron: STALE QEMS cron entries still present (should be removed by installer)"
  crontab -l 2>/dev/null | grep 'qems-.*backup\|Downloads/QEMS/scripts/backup-database' || true
else
  echo "cron: no QEMS Downloads-based cron entries (good)"
fi

echo ""
echo "Backup files in $DB_DIR:"
if [ -d "$DB_DIR" ]; then
  COUNT="$(find "$DB_DIR" -type f -name 'qems-*.dump' 2>/dev/null | wc -l | tr -d ' ')"
  echo "  count: $COUNT"
  find "$DB_DIR" -type f -name 'qems-*.dump' -print0 2>/dev/null \
    | xargs -0 stat -f '  %Sm  %z bytes  %N' -t '%Y-%m-%d %H:%M:%S' 2>/dev/null \
    | sort \
    | tail -n 10
else
  echo "  (directory missing)"
fi

echo ""
echo "Recent log ($LOG_FILE):"
if [ -f "$LOG_FILE" ]; then
  tail -n 15 "$LOG_FILE"
else
  echo "  (no log yet)"
fi
