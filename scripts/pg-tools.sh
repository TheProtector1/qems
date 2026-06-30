#!/usr/bin/env bash
# Resolve pg_dump/pg_restore — prefer the highest installed major version (Homebrew PATH often has an older one).
resolve_pg_tool() {
  local tool="$1"
  local best="" best_major=0 path major

  _consider() {
    path="$1"
    [ -x "$path" ] || return 0
    major="$("$path" --version 2>/dev/null | grep -oE '[0-9]+' | head -1 || echo 0)"
    if [ "$major" -ge "$best_major" ]; then
      best="$path"
      best_major="$major"
    fi
  }

  if command -v "$tool" >/dev/null 2>&1; then
    _consider "$(command -v "$tool")"
  fi

  for path in /opt/homebrew/opt/postgresql@*/bin/"$tool" /usr/local/opt/postgresql@*/bin/"$tool"; do
    [ -e "$path" ] && _consider "$path"
  done

  for path in /opt/homebrew/opt/libpq/bin/"$tool" /usr/local/opt/libpq/bin/"$tool"; do
    [ -x "$path" ] && _consider "$path"
  done

  if [ -z "$best" ]; then
    return 1
  fi
  printf '%s' "$best"
}
