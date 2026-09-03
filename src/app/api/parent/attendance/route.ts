import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertParentOwnsStudent } from "@/lib/parent-portal-data";
import { buildHifzDayMap } from "@/lib/hifz-lesson-status";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const month = Number(searchParams.get("month") || new Date().getMonth() + 1);
    const year = Number(searchParams.get("year") || new Date().getFullYear());

    if (!studentId) {
      const parent = await prisma.parent.findUnique({
        where: { userId: session.user.id },
        include: {
          students: {
            select: {
              id: true,
              fullName: true,
              studentId: true,
              photo: true,
              gender: true,
              programType: true,
            },
            orderBy: { fullName: "asc" },
          },
        },
      });
      return NextResponse.json({ children: parent?.students ?? [] });
    }

    const allowed = await assertParentOwnsStudent(session.user.id, studentId);
    if (!allowed) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const [records, hifzRecords] = await Promise.all([
      prisma.attendance.findMany({
        where: {
          studentId,
          date: { gte: start, lte: end },
        },
        orderBy: { date: "asc" },
      }),
      prisma.hifzRecord.findMany({
        where: {
          studentId,
          date: { gte: start, lte: end },
          type: { in: ["SABAQ", "SABQI", "MANZIL"] },
        },
        select: { date: true, type: true, ayahFrom: true, ayahTo: true, teacherNote: true },
        orderBy: { date: "asc" },
      }),
    ]);

    const hifzByDay = buildHifzDayMap(
      hifzRecords.map((r) => ({ ...r, date: r.date.toISOString().slice(0, 10) }))
    );

    return NextResponse.json({
      records: records.map((r) => ({
        date: r.date.toISOString().slice(0, 10),
        status: r.status,
        leaveReason: r.leaveReason,
        leaveRequestedBy: r.leaveRequestedBy,
        hifz: hifzByDay[r.date.toISOString().slice(0, 10)] || undefined,
      })),
      hifzByDay,
    });
  } catch (error) {
    console.error("Parent attendance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
