import { prisma } from "@/lib/prisma";
import { parseDateOnly, todayDateKey, addDaysToDateKey } from "@/lib/timezone";
import { AttendanceStatus } from "@prisma/client";

export async function applyLeaveToAttendance(opts: {
  studentId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  requestedByName: string;
  markedById?: string | null;
}) {
  const startKey = opts.startDate.toISOString().slice(0, 10);
  const endKey = opts.endDate.toISOString().slice(0, 10);
  let cursor = startKey;
  const created: string[] = [];

  while (cursor <= endKey) {
    const date = parseDateOnly(cursor);
    const existing = await prisma.attendance.findFirst({
      where: { studentId: opts.studentId, date, classId: null },
    });

    if (existing) {
      await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          status: AttendanceStatus.LEAVE,
          leaveReason: opts.reason,
          leaveRequestedBy: opts.requestedByName,
          markedById: opts.markedById ?? existing.markedById,
        },
      });
    } else {
      await prisma.attendance.create({
        data: {
          studentId: opts.studentId,
          date,
          status: AttendanceStatus.LEAVE,
          leaveReason: opts.reason,
          leaveRequestedBy: opts.requestedByName,
          markedById: opts.markedById ?? null,
          classId: null,
        },
      });
    }
    created.push(cursor);
    cursor = addDaysToDateKey(cursor, 1);
  }

  return created;
}

export function leaveSpanDays(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
}

export function isLeaveInFutureOrToday(end: Date) {
  const today = parseDateOnly(todayDateKey());
  return end >= today;
}
