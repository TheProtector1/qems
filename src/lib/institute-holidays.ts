import { HolidayType, InstituteHoliday, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dateKeyFromStored, parseDateOnly } from "@/lib/timezone";

export type HolidayMatch = {
  id: string;
  name: string;
  type: HolidayType;
};

export { parseDateOnly };

export function dateKey(date: Date): string {
  return dateKeyFromStored(date);
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

  if (students.length === 0) return { synced: 0, holiday };

  const studentIds = students.map((s) => s.id);
  const existing = await tx.attendance.findMany({
    where: { studentId: { in: studentIds }, date, classId: null },
    select: { id: true, studentId: true, status: true },
  });

  const existingByStudent = new Map(existing.map((row) => [row.studentId, row]));
  const toCreate: Array<{ studentId: string; date: Date; status: "HOLIDAY"; classId: null }> = [];
  const toUpdateIds: string[] = [];

  for (const student of students) {
    const row = existingByStudent.get(student.id);
    if (row) {
      if (row.status !== "HOLIDAY") toUpdateIds.push(row.id);
    } else {
      toCreate.push({
        studentId: student.id,
        date,
        status: "HOLIDAY",
        classId: null,
      });
    }
  }

  if (toUpdateIds.length) {
    await tx.attendance.updateMany({
      where: { id: { in: toUpdateIds } },
      data: {
        status: "HOLIDAY",
        leaveReason: null,
        leaveRequestedBy: null,
      },
    });
  }

  if (toCreate.length) {
    await tx.attendance.createMany({ data: toCreate });
  }

  const synced = toUpdateIds.length + toCreate.length;

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
