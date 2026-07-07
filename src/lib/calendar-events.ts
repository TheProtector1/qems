import { format, isValid, parseISO } from "date-fns";
import { dateKeyFromStored, parseDateOnly } from "@/lib/timezone";

export type CalendarEventType = "HOLIDAY" | "EXAM" | "EVENT" | "ACADEMIC";

export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  type: CalendarEventType;
};

export function eventDateKey(value: string | Date | null | undefined): string {
  if (!value) return "";
  if (value instanceof Date) return dateKeyFromStored(value);
  return String(value).slice(0, 10);
}

export function parseEventDate(value: string | Date | null | undefined): Date | null {
  const key = eventDateKey(value);
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  return parseDateOnly(key);
}

export function normalizeCalendarEvents(data: unknown): CalendarEvent[] {
  if (!Array.isArray(data)) return [];

  return data
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const startDate = eventDateKey(row.startDate as string);
      const endDate = eventDateKey(row.endDate as string);
      const type = row.type as CalendarEventType;
      const title = typeof row.title === "string" ? row.title : "";
      const id = typeof row.id === "string" ? row.id : "";

      if (!id || !title || !startDate || !endDate) return null;
      if (!["HOLIDAY", "EXAM", "EVENT", "ACADEMIC"].includes(type)) return null;

      return {
        id,
        title,
        description: typeof row.description === "string" ? row.description : null,
        startDate,
        endDate,
        type,
      };
    })
    .filter((event): event is CalendarEvent => Boolean(event));
}

export function eventSpansDate(event: CalendarEvent, date: Date): boolean {
  const start = parseEventDate(event.startDate);
  const end = parseEventDate(event.endDate);
  if (!start || !end) return false;

  const current = parseDateOnly(format(date, "yyyy-MM-dd"));
  return current >= start && current <= end;
}

export function safeFormatEventDate(
  value: string | Date | null | undefined,
  pattern: string,
  fallback = "—"
): string {
  const date = typeof value === "string" ? parseISO(eventDateKey(value)) : value;
  if (!date || !isValid(date)) return fallback;
  try {
    return format(date, pattern);
  } catch {
    return fallback;
  }
}
