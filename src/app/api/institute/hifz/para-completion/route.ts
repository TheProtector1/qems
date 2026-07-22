import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HifzDirection, NotificationType, ProgramType } from "@prisma/client";
import { getDefaultStartingJuz, getNextPara, parseHifzDirection } from "@/lib/hifz-progress";
import { notifyParentOfStudent } from "@/lib/notifications";
import { tryAwardBadgesForStudent } from "@/lib/badges";
import { ensureAlumniFromHifzCompletion } from "@/lib/alumni";

export const dynamic = "force-dynamic";

function parseDateOnly(value: string): Date {
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

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, instituteId: session.user.instituteId },
      select: { id: true, hifzCompletedAt: true },
    });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const completions = await prisma.hifzParaCompletion.findMany({
      where: { studentId },
      include: { markedBy: { include: { user: { select: { name: true } } } } },
      orderBy: { paraNumber: "asc" },
    });

    return NextResponse.json({
      completions: completions.map((c) => ({
        id: c.id,
        paraNumber: c.paraNumber,
        completedAt: dateKey(c.completedAt),
        daysToComplete: c.daysToComplete,
        notes: c.notes,
        markedByName: c.markedBy?.user?.name ?? null,
      })),
      hifzCompleted: Boolean(student.hifzCompletedAt),
    });
  } catch (error) {
    console.error("[HIFZ_PARA_COMPLETION_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = new Set([
      "INSTITUTE_OWNER",
      "BRANCH_MANAGER",
      "TEACHER",
      "SUPER_ADMIN",
    ]);
    if (!allowedRoles.has(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const instituteId = session.user.instituteId;
    const body = await req.json();
    const { studentId, paraNumber, daysToComplete, notes, completedAt } = body as {
      studentId: string;
      paraNumber: number;
      daysToComplete: number;
      notes?: string;
      completedAt?: string;
    };

    if (!studentId || !paraNumber) {
      return NextResponse.json({ error: "studentId and paraNumber are required" }, { status: 400 });
    }

    const para = parseInt(String(paraNumber), 10);
    if (!Number.isFinite(para) || para < 1 || para > 30) {
      return NextResponse.json({ error: "paraNumber must be between 1 and 30" }, { status: 400 });
    }

    const days = parseInt(String(daysToComplete), 10);
    if (!Number.isFinite(days) || days < 1) {
      return NextResponse.json({ error: "daysToComplete must be at least 1" }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, instituteId, programType: ProgramType.HIFZ },
    });
    if (!student) {
      return NextResponse.json({ error: "Hifz student not found" }, { status: 404 });
    }

    if (session.user.role === "TEACHER") {
      const teacher = await prisma.teacher.findFirst({
        where: { userId: session.user.id, instituteId },
        select: { id: true },
      });
      if (teacher && student.teacherId && student.teacherId !== teacher.id) {
        return NextResponse.json(
          { error: "You can only mark paras for your assigned students" },
          { status: 403 }
        );
      }
    }

    if (student.hifzCompletedAt) {
      return NextResponse.json({ error: "Student has already completed full Hifz" }, { status: 400 });
    }

    const direction = parseHifzDirection(student.hifzDirection ?? HifzDirection.REVERSE);
    let currentPara = student.currentPara ?? student.currentJuz;
    if (!currentPara) {
      currentPara = getDefaultStartingJuz(direction);
    }
    if (para !== currentPara) {
      return NextResponse.json(
        { error: `Only the current para (${currentPara}) can be marked complete. Click that para on the grid.` },
        { status: 400 }
      );
    }

    const existing = await prisma.hifzParaCompletion.findUnique({
      where: { studentId_paraNumber: { studentId, paraNumber: para } },
    });
    if (existing) {
      return NextResponse.json({ error: `Para ${para} is already marked complete` }, { status: 400 });
    }

    const teacher = await prisma.teacher.findFirst({
      where: { userId: session.user.id, instituteId },
    });

    const completionDate = completedAt ? parseDateOnly(completedAt) : new Date();
    const nextPara = getNextPara(direction, para);

    const result = await prisma.$transaction(async (tx) => {
      const completion = await tx.hifzParaCompletion.create({
        data: {
          studentId,
          paraNumber: para,
          completedAt: completionDate,
          daysToComplete: days,
          notes: notes?.trim() || null,
          markedById: teacher?.id ?? null,
        },
        include: { markedBy: { include: { user: { select: { name: true } } } } },
      });

      const studentUpdate: {
        currentJuz: number | null;
        currentPara: number | null;
        hifzCompletedAt?: Date;
        hifzDirection?: HifzDirection;
      } = {
        currentJuz: nextPara,
        currentPara: nextPara,
        hifzDirection: student.hifzDirection ?? direction,
      };

      if (nextPara === null) {
        studentUpdate.hifzCompletedAt = completionDate;
        studentUpdate.currentJuz = para;
        studentUpdate.currentPara = para;
      }

      const updatedStudent = await tx.student.update({
        where: { id: studentId },
        data: studentUpdate,
        select: {
          currentJuz: true,
          currentPara: true,
          hifzCompletedAt: true,
          hifzDirection: true,
        },
      });

      return { completion, updatedStudent };
    });

    if (result.updatedStudent.hifzCompletedAt) {
      await notifyParentOfStudent(studentId, {
        type: NotificationType.ACHIEVEMENT,
        title: "Hifz completed!",
        message: `${student.fullName} has completed the full Hifz program. MashaAllah!`,
        data: { studentId, completedAt: dateKey(result.updatedStudent.hifzCompletedAt) },
      });
      await ensureAlumniFromHifzCompletion(studentId, instituteId).catch((err) =>
        console.error("[ALUMNI_AUTO_CREATE]", err)
      );
    }

    const completedCount = await prisma.hifzParaCompletion.count({ where: { studentId } });
    await tryAwardBadgesForStudent(studentId, {
      completedParas: completedCount,
      hifzCompleted: Boolean(result.updatedStudent.hifzCompletedAt),
      currentJuz: result.updatedStudent.currentJuz,
    });

    return NextResponse.json({
      success: true,
      completion: {
        id: result.completion.id,
        paraNumber: result.completion.paraNumber,
        completedAt: dateKey(result.completion.completedAt),
        daysToComplete: result.completion.daysToComplete,
        notes: result.completion.notes,
        markedByName: result.completion.markedBy?.user?.name ?? null,
      },
      student: {
        currentJuz: result.updatedStudent.currentJuz,
        currentPara: result.updatedStudent.currentPara,
        hifzCompleted: Boolean(result.updatedStudent.hifzCompletedAt),
        nextPara: result.updatedStudent.hifzCompletedAt
          ? null
          : result.updatedStudent.currentPara,
      },
      hifzCompleted: Boolean(result.updatedStudent.hifzCompletedAt),
      message: result.updatedStudent.hifzCompletedAt
        ? "Mabrook! Full Hifz completed."
        : `Para ${para} marked complete. Student moved to Para ${result.updatedStudent.currentPara}.`,
    });
  } catch (error) {
    console.error("[HIFZ_PARA_COMPLETION_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
