import { HolidayType, InstituteHoliday, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type HolidayMatch = {
  id: string;
  name: string;
  type: HolidayType;
};

export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function eachDateInRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export function getHolidayForDate(
  holidays: InstituteHoliday[],
  date: Date
): HolidayMatch | null {
  const dayOfWeek = date.getUTCDay();
  const dk = dateKey(date);

  for (const h of holidays) {
    if (!h.isActive) continue;

    if (h.type === "WEEKLY" && h.dayOfWeek === dayOfWeek) {
      return { id: h.id, name: h.name, type: h.type };
    }

    if ((h.type === "PUBLIC" || h.type === "SCHEDULED") && h.startDate && h.endDate) {
      const start = dateKey(h.startDate);
      const end = dateKey(h.endDate);
      if (dk >= start && dk <= end) {
        return { id: h.id, name: h.name, type: h.type };
      }
    }
  }

  return null;
}

export function getWeeklyOffDays(holidays: InstituteHoliday[]): number[] {
  return holidays
    .filter((h) => h.isActive && h.type === "WEEKLY" && h.dayOfWeek !== null)
    .map((h) => h.dayOfWeek as number)
    .sort((a, b) => a - b);
}

export async function fetchActiveHolidays(instituteId: string) {
  return prisma.instituteHoliday.findMany({
    where: { instituteId, isActive: true },
    orderBy: [{ type: "asc" }, { dayOfWeek: "asc" }, { startDate: "asc" }],
  });
}

export async function syncHolidayAttendanceForDate(
  instituteId: string,
  date: Date,
  tx: Prisma.TransactionClient = prisma
): Promise<{ synced: number; holiday: HolidayMatch | null }> {
  const holidays = await tx.instituteHoliday.findMany({
    where: { instituteId, isActive: true },
  });
  const holiday = getHolidayForDate(holidays, date);
  if (!holiday) return { synced: 0, holiday: null };

  const students = await tx.student.findMany({
    where: { instituteId, isActive: true },
    select: { id: true },
  });

  let synced = 0;
  for (const student of students) {
    const existing = await tx.attendance.findFirst({
      where: { studentId: student.id, date, classId: null },
    });

    if (existing) {
      if (existing.status !== "HOLIDAY") {
        await tx.attendance.update({
          where: { id: existing.id },
          data: {
            status: "HOLIDAY",
            leaveReason: null,
            leaveRequestedBy: null,
          },
        });
        synced++;
      }
    } else {
      await tx.attendance.create({
        data: {
          studentId: student.id,
          date,
          status: "HOLIDAY",
          classId: null,
        },
      });
      synced++;
    }
  }

  return { synced, holiday };
}

export async function syncHolidayAttendanceForRange(
  instituteId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const holidays = await fetchActiveHolidays(instituteId);
  const dates = eachDateInRange(startDate, endDate);
  let totalSynced = 0;

  for (const date of dates) {
    if (!getHolidayForDate(holidays, date)) continue;
    const { synced } = await syncHolidayAttendanceForDate(instituteId, date);
    totalSynced += synced;
  }

  return totalSynced;
}

export async function clearHolidayAttendanceForRange(
  instituteId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const result = await prisma.attendance.deleteMany({
    where: {
      status: "HOLIDAY",
      date: { gte: startDate, lte: endDate },
      classId: null,
      student: { instituteId },
    },
  });
  return result.count;
}

export async function clearWeeklyHolidayAttendance(
  instituteId: string,
  dayOfWeek: number,
  fromDate: Date,
  toDate: Date
): Promise<number> {
  const dates = eachDateInRange(fromDate, toDate).filter((d) => d.getUTCDay() === dayOfWeek);
  if (dates.length === 0) return 0;

  const result = await prisma.attendance.deleteMany({
    where: {
      status: "HOLIDAY",
      date: { in: dates },
      classId: null,
      student: { instituteId },
    },
  });
  return result.count;
}

export const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
