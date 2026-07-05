#!/usr/bin/env bash
# Shared helper — resolves the Postgres URL from env or .env files.
# Supports Prisma (quran_education_DATABASE_URL), GitHub Actions (QURAN_EDUCATION_DATABASE_URL), and DATABASE_URL.

load_database_url() {
  local root="${1:-}"
  local f val

  # Environment variables (CI / cron) — check all common names
  for var in quran_education_DATABASE_URL QURAN_EDUCATION_DATABASE_URL DATABASE_URL; do
    val="${!var:-}"
    if [ -n "$val" ]; then
      printf '%s' "$val"
      return 0
    fi
  done

  if [ -n "$root" ]; then
    for f in "$root/.env.local" "$root/.env"; do
      if [ -f "$f" ]; then
        val="$(
          grep -E '^(quran_education_DATABASE_URL|QURAN_EDUCATION_DATABASE_URL|DATABASE_URL)=' "$f" \
            | tail -n 1 \
            | cut -d= -f2- \
            | sed 's/^["'\''"]//;s/["'\''"]$//' \
            || true
        )"
        if [ -n "$val" ]; then
          printf '%s' "$val"
          return 0
        fi
      fi
    done
  fi

  return 1
}
