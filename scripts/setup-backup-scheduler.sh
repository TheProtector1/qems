#!/usr/bin/env bash
# Install a permanent, TCC-safe QEMS backup scheduler on macOS.
#
# Why this exists:
#   macOS blocks cron from reading/executing files under ~/Downloads
#   ("Operation not permitted"). This installer copies the backup tooling
#   into ~/.qems-backups (outside protected folders) and schedules it with
#   launchd, which is the reliable macOS scheduler.
#
# Schedule: every 30 minutes
# Retention: last 2 days (BACKUP_RETENTION_DAYS)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
INSTALL_ROOT="${QEMS_BACKUP_HOME:-$HOME/.qems-backups}"
BIN_DIR="$INSTALL_ROOT/bin"
DB_DIR="$INSTALL_ROOT/database"
LOG_DIR="$INSTALL_ROOT/logs"
ENV_FILE="$INSTALL_ROOT/.env"
PLIST_LABEL="io.qems.database-backup"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_LABEL}.plist"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-2}"

CRON_TAG="# qems-half-hour-backup"
OLD_CRON_TAG="# qems-hourly-backup"

mkdir -p "$BIN_DIR" "$DB_DIR" "$LOG_DIR" "$HOME/Library/LaunchAgents"

# shellcheck source=load-database-url.sh
source "$ROOT_DIR/scripts/load-database-url.sh"

DATABASE_URL="$(load_database_url "$ROOT_DIR")" || {
  echo "ERROR: Could not find database URL in $ROOT_DIR/.env or .env.local"
  echo "Set quran_education_DATABASE_URL or DATABASE_URL, then re-run."
  exit 1
}

# Persist URL where launchd can read it (Downloads is TCC-blocked for background agents).
umask 077
printf 'quran_education_DATABASE_URL=%s\nDATABASE_URL=%s\n' "$DATABASE_URL" "$DATABASE_URL" > "$ENV_FILE"
chmod 600 "$ENV_FILE"

# Copy self-contained backup tooling into the safe install root.
cp "$ROOT_DIR/scripts/backup-database.sh" "$BIN_DIR/backup-database.sh"
cp "$ROOT_DIR/scripts/load-database-url.sh" "$BIN_DIR/load-database-url.sh"
cp "$ROOT_DIR/scripts/pg-tools.sh" "$BIN_DIR/pg-tools.sh"
chmod +x "$BIN_DIR/backup-database.sh"

cat > "$BIN_DIR/run-backup.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

INSTALL_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin${PATH:+:$PATH}"
export BACKUP_DIR="$INSTALL_ROOT/database"
export BACKUP_LOG="$INSTALL_ROOT/logs/backup.log"
export BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-2}"

# Ensure parent helpers resolve relative to the installed copy.
cd "$INSTALL_ROOT"
exec /bin/bash "$INSTALL_ROOT/bin/backup-database.sh"
EOF
chmod +x "$BIN_DIR/run-backup.sh"

# Remove broken cron entries that try to run scripts from Downloads.
CURRENT="$(crontab -l 2>/dev/null || true)"
if [ -n "$CURRENT" ]; then
  FILTERED="$(
    printf '%s\n' "$CURRENT" \
      | grep -vF "$CRON_TAG" \
      | grep -vF "$OLD_CRON_TAG" \
      | grep -v 'Downloads/QEMS/scripts/backup-database.sh' \
      || true
  )"
  # Avoid writing a crontab that is only blank lines
  if [ -n "$(printf '%s' "$FILTERED" | tr -d '[:space:]')" ]; then
    printf '%s\n' "$FILTERED" | crontab -
  else
    crontab -r 2>/dev/null || true
  fi
fi

echo "Running an immediate backup to verify the install..."
if ! /bin/bash "$BIN_DIR/run-backup.sh"; then
  echo ""
  echo "ERROR: Immediate backup failed. Scheduler was NOT loaded."
  echo "Check $LOG_DIR/backup.log"
  exit 1
fi

# Unload any previous agent, then install the new plist.
launchctl bootout "gui/$(id -u)/$PLIST_LABEL" 2>/dev/null || true
launchctl unload "$PLIST_PATH" 2>/dev/null || true

cat > "$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${PLIST_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>${BIN_DIR}/run-backup.sh</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${INSTALL_ROOT}</string>
  <key>StartInterval</key>
  <integer>1800</integer>
  <key>RunAtLoad</key>
  <true/>
  <key>Nice</key>
  <integer>10</integer>
  <key>StandardOutPath</key>
  <string>${LOG_DIR}/launchd.out.log</string>
  <key>StandardErrorPath</key>
  <string>${LOG_DIR}/launchd.err.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin</string>
    <key>BACKUP_RETENTION_DAYS</key>
    <string>${RETENTION_DAYS}</string>
    <key>HOME</key>
    <string>${HOME}</string>
  </dict>
</dict>
</plist>
EOF

launchctl bootstrap "gui/$(id -u)" "$PLIST_PATH" 2>/dev/null \
  || launchctl load -w "$PLIST_PATH"

echo ""
echo "SUCCESS: Permanent half-hourly backup scheduler installed."
echo ""
echo "Details:"
echo "  Agent:     $PLIST_LABEL (every 30 minutes via launchd)"
echo "  Scripts:   $BIN_DIR/"
echo "  Backups:   $DB_DIR/"
echo "  Logs:      $LOG_DIR/backup.log"
echo "  Env file:  $ENV_FILE"
echo "  Retention: $RETENTION_DAYS days"
echo ""
echo "Useful commands:"
echo "  npm run backup              # manual backup from project"
echo "  npm run backup:status       # check scheduler + latest dump"
echo "  npm run backup:install      # reinstall / refresh DB URL"
echo ""
echo "Important: if you change the database password/URL, re-run:"
echo "  npm run backup:install"
echo ""
echo "Cloud backup (works even when this Mac is off): push the repo so"
echo "GitHub Actions workflow '.github/workflows/database-backup.yml' is active,"
echo "with secret QURAN_EDUCATION_DATABASE_URL set."
