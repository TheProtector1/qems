import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertParentOwnsStudent, getParentChildIds } from "@/lib/parent-portal-data";

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
      const children = await getParentChildIds(session.user.id);
      return NextResponse.json({ children });
    }

    const allowed = await assertParentOwnsStudent(session.user.id, studentId);
    if (!allowed) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const records = await prisma.attendance.findMany({
      where: {
        studentId,
        date: { gte: start, lte: end },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({
      records: records.map((r) => ({
        date: r.date.toISOString().slice(0, 10),
        status: r.status,
      })),
    });
  } catch (error) {
    console.error("Parent attendance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
