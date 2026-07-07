/**
 * All institute operations use Pakistan Standard Time (Asia/Karachi, UTC+5).
 * Date-only fields in the database are stored as UTC midnight for that calendar day.
 */

export const APP_TIMEZONE = "Asia/Karachi";
export const APP_TIMEZONE_LABEL = "Pakistan Standard Time";
export const APP_TIMEZONE_SHORT = "PKT";

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("en-PK", {
  timeZone: APP_TIMEZONE,
  weekday: "long",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-PK", {
  timeZone: APP_TIMEZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-PK", {
  timeZone: APP_TIMEZONE,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-PK", {
  timeZone: APP_TIMEZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIMEZONE,
  weekday: "short",
});

/** Parse YYYY-MM-DD into a UTC-midnight Date (for @db.Date storage). */
export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Read a stored @db.Date value back as YYYY-MM-DD. */
export function dateKeyFromStored(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Calendar day in Pakistan for a live timestamp. */
export function dateKeyInAppTz(date: Date = new Date()): string {
  return dateKeyFormatter.format(date);
}

/** Today's date in Pakistan (YYYY-MM-DD). */
export function todayDateKey(now: Date = new Date()): string {
  return dateKeyInAppTz(now);
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const d = parseDateOnly(dateKey);
  d.setUTCDate(d.getUTCDate() + days);
  return dateKeyFromStored(d);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Weekday index 0=Sun … 6=Sat for a stored calendar date. */
export function weekdayIndexForDateKey(dateKey: string): number {
  return parseDateOnly(dateKey).getUTCDay();
}

export function formatDatePK(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseDateOnly(date) : date;
  return shortDateFormatter.format(d);
}

export function formatLongDatePK(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseDateOnly(date) : date;
  return dateFormatter.format(d);
}

export function formatTimePK(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return timeFormatter.format(d);
}

export function formatDateTimePK(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return `${dateTimeFormatter.format(d)} ${APP_TIMEZONE_SHORT}`;
}

export function formatWeekdayPK(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseDateOnly(date) : date;
  return weekdayFormatter.format(d);
}

export function getPakistanClockSnapshot(now: Date = new Date()) {
  return {
    dateKey: dateKeyInAppTz(now),
    longDate: dateFormatter.format(now),
    shortDate: shortDateFormatter.format(now),
    time: timeFormatter.format(now),
    weekday: weekdayFormatter.format(now),
    timezone: APP_TIMEZONE_SHORT,
    label: APP_TIMEZONE_LABEL,
  };
}
