#!/usr/bin/env bash
# Compatibility wrapper — installs the permanent launchd scheduler.
# (Legacy name kept so older docs / npm scripts keep working.)
set -euo pipefail
exec "$(cd "$(dirname "$0")" && pwd)/setup-backup-scheduler.sh"
