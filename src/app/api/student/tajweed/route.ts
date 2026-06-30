import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildTajweedPayload } from "@/lib/quran-portal-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const payload = await buildTajweedPayload([student.id]);
    if (!payload.students.length) {
      return NextResponse.json({ error: "Tajweed program not enrolled" }, { status: 404 });
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("[STUDENT_TAJWEED_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
