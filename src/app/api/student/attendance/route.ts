import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDaysToDateKey, dateKeyFromStored, todayDateKey } from "@/lib/timezone";

export const dynamic = "force-dynamic";

function dateKey(date: Date) {
  return dateKeyFromStored(date);
}

function computeStreak(dates: string[]) {
  if (!dates.length) return 0;
  const presentSet = new Set(dates);
  const todayKey = todayDateKey();
  let streak = 0;
  for (let i = 0; i < 120; i++) {
    const key = addDaysToDateKey(todayKey, -i);
    if (presentSet.has(key)) streak++;
    else if (i > 0) break;
  }
  return streak;
}

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        fullName: true,
        studentId: true,
        photo: true,
        gender: true,
        programType: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const month = Number(searchParams.get("month") || new Date().getMonth() + 1);
    const year = Number(searchParams.get("year") || new Date().getFullYear());

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const [monthRecords, recentPresent] = await Promise.all([
      prisma.attendance.findMany({
        where: { studentId: student.id, date: { gte: start, lte: end } },
        orderBy: { date: "asc" },
      }),
      prisma.attendance.findMany({
        where: {
          studentId: student.id,
          status: { in: ["PRESENT", "LATE"] },
          date: { gte: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000) },
        },
        select: { date: true },
        orderBy: { date: "desc" },
      }),
    ]);

    const records = monthRecords.map((r) => ({
      id: r.id,
      date: dateKey(r.date),
      status: r.status,
      leaveReason: r.leaveReason,
      leaveRequestedBy: r.leaveRequestedBy,
    }));

    const present = records.filter((r) => r.status === "PRESENT").length;
    const absent = records.filter((r) => r.status === "ABSENT").length;
    const late = records.filter((r) => r.status === "LATE").length;
    const leave = records.filter((r) => r.status === "LEAVE").length;
    const holiday = records.filter((r) => r.status === "HOLIDAY").length;
    const marked = records.filter((r) => r.status !== "HOLIDAY").length;
    const rate = marked ? Math.round(((present + late) / marked) * 100) : 0;

    const streak = computeStreak(recentPresent.map((r) => dateKey(r.date)));

    return NextResponse.json({
      student,
      month,
      year,
      records,
      summary: { present, absent, late, leave, holiday, marked, rate, streak },
    });
  } catch (error) {
    console.error("Student attendance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
