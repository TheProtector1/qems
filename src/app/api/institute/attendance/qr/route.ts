import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkInByQrToken, ensureStudentQrToken, generateQrToken } from "@/lib/qr-attendance";
import { todayDateKey } from "@/lib/timezone";

export const dynamic = "force-dynamic";

const STAFF = new Set(["INSTITUTE_OWNER", "BRANCH_MANAGER", "TEACHER", "SUPER_ADMIN"]);

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId || !STAFF.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentId = new URL(req.url).searchParams.get("studentId");
    if (!studentId) {
      return NextResponse.json({ error: "studentId required" }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, instituteId: session.user.instituteId },
      select: { id: true },
    });
    if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const withToken = await ensureStudentQrToken(studentId);
    return NextResponse.json({
      studentId: withToken!.id,
      studentCode: withToken!.studentId,
      fullName: withToken!.fullName,
      qrToken: withToken!.qrToken,
      /** Payload for QR generators — scan URL or raw token */
      qrPayload: withToken!.qrToken,
    });
  } catch (error) {
    console.error("[QR_ATTENDANCE_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId || !STAFF.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { token, date, action, studentId } = body as {
      token?: string;
      date?: string;
      action?: "checkin" | "regenerate";
      studentId?: string;
    };

    if (action === "regenerate" && studentId) {
      const student = await prisma.student.findFirst({
        where: { id: studentId, instituteId: session.user.instituteId },
        select: { id: true },
      });
      if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const qrToken = generateQrToken();
      const updated = await prisma.student.update({
        where: { id: studentId },
        data: { qrToken, qrTokenCreatedAt: new Date() },
        select: { id: true, qrToken: true, fullName: true, studentId: true },
      });
      return NextResponse.json({ success: true, qrToken: updated.qrToken, student: updated });
    }

    if (!token?.trim()) {
      return NextResponse.json({ error: "QR token required" }, { status: 400 });
    }

    const teacher = await prisma.teacher.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });

    const result = await checkInByQrToken({
      token: token.trim(),
      instituteId: session.user.instituteId,
      markedById: teacher?.id ?? null,
      dateKey: date || todayDateKey(),
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      alreadyMarked: result.alreadyMarked,
      student: result.student,
      status: result.status,
      checkInTime: result.checkInTime,
    });
  } catch (error) {
    console.error("[QR_ATTENDANCE_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
