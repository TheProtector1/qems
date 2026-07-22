import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AttendanceStatus, NotificationType } from "@prisma/client";
import { notifyParentOfStudent } from "@/lib/notifications";
import {
  clearStaleHolidayAttendance,
  getHolidayForDate,
  getWeeklyOffDays,
  parseDateOnly,
  syncHolidayAttendanceForDate,
} from "@/lib/institute-holidays";
import { getCachedInstituteHolidays } from "@/lib/server-cache";
import {
  addDaysToDateKey,
  dateKeyFromStored,
  formatDatePK,
  todayDateKey,
  weekdayIndexForDateKey,
} from "@/lib/timezone";

export const dynamic = "force-dynamic";

function dateKey(date: Date) {
  return dateKeyFromStored(date);
}

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instituteId = session.user.instituteId;
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const studentId = searchParams.get("studentId");
    const program = searchParams.get("program");
    const historyDays = Math.min(parseInt(searchParams.get("days") || "7", 10), 30);

    const holidays = await getCachedInstituteHolidays(instituteId);
    const weeklyOffDays = getWeeklyOffDays(holidays);

    const programFilter =
      program && program !== "ALL"
        ? { programType: program.toUpperCase() as "HIFZ" | "NAZRA" | "TAJWEED" }
        : {};

    const students = await prisma.student.findMany({
      where: { instituteId, isActive: true, ...programFilter },
      select: {
        id: true,
        fullName: true,
        studentId: true,
        gender: true,
        programType: true,
      },
      orderBy: { fullName: "asc" },
    });

    if (month && year && studentId) {
      const y = parseInt(year, 10);
      const m = parseInt(month, 10);
      const start = new Date(Date.UTC(y, m - 1, 1));
      const end = new Date(Date.UTC(y, m, 0));

      const records = await prisma.attendance.findMany({
        where: {
          studentId,
          student: { instituteId },
          date: { gte: start, lte: end },
        },
        orderBy: { date: "asc" },
      });

      return NextResponse.json({
        studentId,
        month: m,
        year: y,
        records: records.map((r) => ({
          id: r.id,
          date: dateKey(r.date),
          status: r.status,
          leaveReason: r.leaveReason,
          leaveRequestedBy: r.leaveRequestedBy,
        })),
      });
    }

    if (month && year) {
      const y = parseInt(year, 10);
      const m = parseInt(month, 10);
      const start = new Date(Date.UTC(y, m - 1, 1));
      const end = new Date(Date.UTC(y, m, 0));

      const records = await prisma.attendance.findMany({
        where: {
          student: { instituteId },
          date: { gte: start, lte: end },
        },
        include: {
          student: { select: { id: true, fullName: true, studentId: true } },
        },
        orderBy: { date: "asc" },
      });

      return NextResponse.json({ students, records, month: m, year: y });
    }

    const dates: string[] = [];
    const todayKey = todayDateKey();
    for (let i = 0; i < historyDays; i++) {
      const dk = addDaysToDateKey(todayKey, -i);
      if (!weeklyOffDays.includes(weekdayIndexForDateKey(dk))) dates.push(dk);
    }
    dates.reverse();

    // Always include at least today so history queries never crash on empty ranges.
    if (dates.length === 0) dates.push(todayKey);

    const startHistory = parseDateOnly(dates[0]);
    const endHistory = parseDateOnly(dates[dates.length - 1]);

    // Stale holiday cleanup is expensive — run async and don't block the response
    void clearStaleHolidayAttendance(instituteId, startHistory, endHistory).catch((err) =>
      console.warn("[ATTENDANCE_STALE_HOLIDAY_CLEANUP]", err)
    );

    // Current calendar month (1st → today) for Rate column on History tab
    const [yStr, mStr] = todayKey.split("-");
    const monthStart = parseDateOnly(`${yStr}-${mStr}-01`);
    const monthEnd = parseDateOnly(todayKey);

    const [historyRecords, monthRecords] = await Promise.all([
      prisma.attendance.findMany({
        where: {
          student: { instituteId },
          date: { gte: startHistory, lte: endHistory },
        },
        select: { studentId: true, date: true, status: true },
      }),
      prisma.attendance.findMany({
        where: {
          student: { instituteId },
          date: { gte: monthStart, lte: monthEnd },
        },
        select: { studentId: true, date: true, status: true },
      }),
    ]);

    const historyMap: Record<string, Record<string, AttendanceStatus>> = {};
    for (const r of historyRecords) {
      const sid = r.studentId;
      const dk = dateKey(r.date);
      if (!historyMap[sid]) historyMap[sid] = {};
      historyMap[sid][dk] = r.status;
    }

    const monthRates: Record<string, { rate: number; marked: number; present: number }> = {};
    const monthByStudent: Record<string, AttendanceStatus[]> = {};
    for (const r of monthRecords) {
      if (!monthByStudent[r.studentId]) monthByStudent[r.studentId] = [];
      monthByStudent[r.studentId].push(r.status);
    }
    for (const s of students) {
      const statuses = monthByStudent[s.id] || [];
      const marked = statuses.filter((st) => st !== "HOLIDAY");
      const present = marked.filter((st) => st === "PRESENT" || st === "LATE").length;
      monthRates[s.id] = {
        marked: marked.length,
        present,
        rate: marked.length ? Math.round((present / marked.length) * 100) : 0,
      };
    }

    if (dateParam) {
      const targetDate = parseDateOnly(dateParam);
      const holidayInfo = getHolidayForDate(holidays, targetDate);

      if (holidayInfo) {
        void syncHolidayAttendanceForDate(instituteId, targetDate).catch((err) =>
          console.warn("[ATTENDANCE_HOLIDAY_SYNC]", err)
        );
      }

      const dayRecords = await prisma.attendance.findMany({
        where: {
          student: { instituteId },
          date: targetDate,
        },
      });

      const attendanceByStudent: Record<string, AttendanceStatus> = {};
      for (const r of dayRecords) {
        attendanceByStudent[r.studentId] = r.status;
      }

      return NextResponse.json({
        students,
        date: dateParam,
        attendance: attendanceByStudent,
        historyDates: dates,
        history: historyMap,
        monthRates,
        isHoliday: Boolean(holidayInfo),
        holiday: holidayInfo,
      });
    }

    const todayStr = todayDateKey();
    const todayDate = parseDateOnly(todayStr);
    const todayHoliday = getHolidayForDate(holidays, todayDate);

    if (todayHoliday) {
      void syncHolidayAttendanceForDate(instituteId, todayDate).catch((err) =>
        console.warn("[ATTENDANCE_HOLIDAY_SYNC]", err)
      );
    }

    const todayRecords = await prisma.attendance.findMany({
      where: {
        student: { instituteId },
        date: todayDate,
      },
    });

    const attendanceByStudent: Record<string, AttendanceStatus> = {};
    for (const r of todayRecords) {
      attendanceByStudent[r.studentId] = r.status;
    }

    return NextResponse.json({
      students,
      date: todayStr,
      attendance: attendanceByStudent,
      historyDates: dates,
      history: historyMap,
      monthRates,
      isHoliday: Boolean(todayHoliday),
      holiday: todayHoliday,
    });
  } catch (error) {
    console.error("Get attendance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instituteId = session.user.instituteId;
    const body = await req.json();
    const { date, records } = body as {
      date: string;
      records: Array<{ studentId: string; status: AttendanceStatus; leaveReason?: string; leaveRequestedBy?: string }>;
    };

    if (!date || !Array.isArray(records)) {
      return NextResponse.json({ error: "Missing date or records" }, { status: 400 });
    }

    const targetDate = parseDateOnly(date);
    const holidays = await getCachedInstituteHolidays(instituteId);
    const holidayInfo = getHolidayForDate(holidays, targetDate);

    if (holidayInfo) {
      await syncHolidayAttendanceForDate(instituteId, targetDate);
      return NextResponse.json({
        success: true,
        isHoliday: true,
        holiday: holidayInfo,
        message: "Attendance is automatically marked as Holiday for this date.",
      });
    }

    const teacher = await prisma.teacher.findFirst({
      where: { userId: session.user.id, instituteId },
    });

    const validRecords = records.filter((r) => r.studentId && r.status);
    if (validRecords.length === 0) {
      return NextResponse.json({ success: true });
    }

    const recordStudentIds = Array.from(new Set(validRecords.map((r) => r.studentId)));
    const [students, existingRows] = await Promise.all([
      prisma.student.findMany({
        where: { id: { in: recordStudentIds }, instituteId },
        select: { id: true, fullName: true },
      }),
      prisma.attendance.findMany({
        where: {
          studentId: { in: recordStudentIds },
          date: targetDate,
          classId: null,
        },
      }),
    ]);

    const studentMap = new Map(students.map((s) => [s.id, s]));
    const existingMap = new Map(existingRows.map((r) => [r.studentId, r]));
    const absentNotifications: Array<{ studentId: string; fullName: string }> = [];
    const toUpdate: Array<{
      id: string;
      status: string;
      markedById: string | null;
      leaveReason: string | null;
      leaveRequestedBy: string | null;
      prevStatus: string;
      studentId: string;
      fullName: string;
    }> = [];
    const toCreate: Array<{
      studentId: string;
      date: Date;
      status: string;
      markedById: string | null;
      leaveReason: string | null;
      leaveRequestedBy: string | null;
      fullName: string;
    }> = [];

    for (const rec of validRecords) {
      const student = studentMap.get(rec.studentId);
      if (!student) continue;
      const existing = existingMap.get(rec.studentId);
      const leaveReason = rec.status === "LEAVE" ? rec.leaveReason ?? null : null;
      const leaveRequestedBy = rec.status === "LEAVE" ? rec.leaveRequestedBy ?? null : null;
      if (existing) {
        toUpdate.push({
          id: existing.id,
          status: rec.status,
          markedById: teacher?.id ?? existing.markedById,
          leaveReason,
          leaveRequestedBy,
          prevStatus: existing.status,
          studentId: rec.studentId,
          fullName: student.fullName,
        });
      } else {
        toCreate.push({
          studentId: rec.studentId,
          date: targetDate,
          status: rec.status,
          markedById: teacher?.id ?? null,
          leaveReason,
          leaveRequestedBy,
          fullName: student.fullName,
        });
      }
    }

    await prisma.$transaction([
      ...toUpdate.map((u) =>
        prisma.attendance.update({
          where: { id: u.id },
          data: {
            status: u.status as never,
            markedById: u.markedById,
            leaveReason: u.leaveReason,
            leaveRequestedBy: u.leaveRequestedBy,
          },
        })
      ),
      ...(toCreate.length
        ? [
            prisma.attendance.createMany({
              data: toCreate.map(({ fullName: _n, ...row }) => ({
                ...row,
                status: row.status as never,
                classId: null,
              })),
            }),
          ]
        : []),
    ]);

    for (const u of toUpdate) {
      if (u.status === "ABSENT" && u.prevStatus !== "ABSENT") {
        absentNotifications.push({ studentId: u.studentId, fullName: u.fullName });
      }
    }
    for (const c of toCreate) {
      if (c.status === "ABSENT") {
        absentNotifications.push({ studentId: c.studentId, fullName: c.fullName });
      }
    }

    if (absentNotifications.length) {
      const dateLabel = formatDatePK(targetDate);
      void Promise.all(
        absentNotifications.map(({ studentId, fullName }) =>
          notifyParentOfStudent(studentId, {
            type: NotificationType.ABSENCE,
            title: "Absence recorded",
            message: `${fullName} was marked absent on ${dateLabel}.`,
            data: { studentId, date },
          })
        )
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save attendance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing record ID" }, { status: 400 });
    }

    const existing = await prisma.attendance.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!existing || existing.student.instituteId !== session.user.instituteId) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    await prisma.attendance.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete attendance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
