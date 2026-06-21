import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AttendanceStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

function parseDateOnly(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
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
    const historyDays = Math.min(parseInt(searchParams.get("days") || "14", 10), 60);

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
        photo: true,
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
    const today = new Date();
    for (let i = 0; i < historyDays; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      if (d.getDay() !== 0) dates.push(dateKey(d));
    }
    dates.reverse();

    const startHistory = parseDateOnly(dates[0]);
    const endHistory = parseDateOnly(dates[dates.length - 1]);

    const historyRecords = await prisma.attendance.findMany({
      where: {
        student: { instituteId },
        date: { gte: startHistory, lte: endHistory },
      },
    });

    const historyMap: Record<string, Record<string, AttendanceStatus>> = {};
    for (const r of historyRecords) {
      const sid = r.studentId;
      const dk = dateKey(r.date);
      if (!historyMap[sid]) historyMap[sid] = {};
      historyMap[sid][dk] = r.status;
    }

    if (dateParam) {
      const targetDate = parseDateOnly(dateParam);
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
      });
    }

    const todayStr = dateKey(today);
    const todayRecords = await prisma.attendance.findMany({
      where: {
        student: { instituteId },
        date: parseDateOnly(todayStr),
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

    const teacher = await prisma.teacher.findFirst({
      where: { userId: session.user.id, instituteId },
    });

    for (const rec of records) {
      if (!rec.studentId || !rec.status) continue;

      const student = await prisma.student.findFirst({
        where: { id: rec.studentId, instituteId },
      });
      if (!student) continue;

      const existing = await prisma.attendance.findFirst({
        where: {
          studentId: rec.studentId,
          date: targetDate,
          classId: null,
        },
      });

      if (existing) {
        await prisma.attendance.update({
          where: { id: existing.id },
          data: {
            status: rec.status,
            markedById: teacher?.id ?? existing.markedById,
            leaveReason: rec.status === "LEAVE" ? rec.leaveReason : null,
            leaveRequestedBy: rec.status === "LEAVE" ? rec.leaveRequestedBy : null,
          },
        });
      } else {
        await prisma.attendance.create({
          data: {
            studentId: rec.studentId,
            date: targetDate,
            status: rec.status,
            classId: null,
            markedById: teacher?.id ?? null,
            leaveReason: rec.status === "LEAVE" ? rec.leaveReason : null,
            leaveRequestedBy: rec.status === "LEAVE" ? rec.leaveRequestedBy : null,
          },
        });
      }
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
