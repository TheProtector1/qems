import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HifzType, ProgramType } from "@prisma/client";
import { getSurahName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instituteId = session.user.instituteId;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "30", 10), 100);

    const studentsWhere: {
      instituteId: string;
      isActive: boolean;
      programType: ProgramType;
      teacherId?: string;
      branchId?: string;
    } = {
      instituteId,
      isActive: true,
      programType: ProgramType.HIFZ,
    };

    if (session.user.role === "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (session.user.role === "TEACHER") {
      const teacher = await prisma.teacher.findFirst({
        where: { userId: session.user.id, instituteId },
      });
      if (teacher) studentsWhere.teacherId = teacher.id;
    }

    if (session.user.role === "BRANCH_MANAGER" && session.user.branchId) {
      studentsWhere.branchId = session.user.branchId;
    }

    const students = await prisma.student.findMany({
      where: studentsWhere,
      select: {
        id: true,
        fullName: true,
        studentId: true,
        photo: true,
        gender: true,
        currentJuz: true,
        currentPara: true,
        hifzDirection: true,
        hifzCompletedAt: true,
        targetCompletionDate: true,
      },
      orderBy: { fullName: "asc" },
    });

    const studentIds = studentId ? [studentId] : students.map((s) => s.id);

    const paraCompletions = await prisma.hifzParaCompletion.findMany({
      where: { studentId: { in: studentIds } },
      include: { markedBy: { include: { user: { select: { name: true } } } } },
      orderBy: [{ studentId: "asc" }, { paraNumber: "asc" }],
    });

    const completionsByStudent: Record<
      string,
      Array<{
        id: string;
        paraNumber: number;
        completedAt: string;
        daysToComplete: number;
        notes: string | null;
        markedByName: string | null;
      }>
    > = {};

    for (const c of paraCompletions) {
      if (!completionsByStudent[c.studentId]) completionsByStudent[c.studentId] = [];
      completionsByStudent[c.studentId].push({
        id: c.id,
        paraNumber: c.paraNumber,
        completedAt: c.completedAt.toISOString().slice(0, 10),
        daysToComplete: c.daysToComplete,
        notes: c.notes,
        markedByName: c.markedBy?.user?.name ?? null,
      });
    }

    const recordsWhere = {
      student: { instituteId },
      ...(studentId ? { studentId } : {}),
    };

    const records = await prisma.hifzRecord.findMany({
      where: recordsWhere,
      include: {
        student: { select: { id: true, fullName: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    const qualityAgg = studentId
      ? await prisma.hifzRecord.aggregate({
          where: { studentId },
          _avg: { rating: true, fluencyScore: true },
        })
      : null;

    return NextResponse.json({
      students: students.map((s) => ({
        ...s,
        hifzCompletedAt: s.hifzCompletedAt?.toISOString() ?? null,
        paraCompletions: completionsByStudent[s.id] ?? [],
      })),
      records: records.map((r) => ({
        id: r.id,
        studentId: r.studentId,
        studentName: r.student.fullName,
        date: r.date.toISOString().slice(0, 10),
        type: r.type,
        surahNumber: r.surahNumber,
        surahName: r.surahName || getSurahName(r.surahNumber),
        ayahFrom: r.ayahFrom,
        ayahTo: r.ayahTo,
        lines: r.lines,
        rating: r.rating,
        errorCount: r.errorCount,
        teacherNote: r.teacherNote,
        createdAt: r.createdAt.toISOString(),
      })),
      quality: qualityAgg
        ? {
            avgRating: qualityAgg._avg.rating ?? 0,
            avgFluency: qualityAgg._avg.fluencyScore
              ? Number(qualityAgg._avg.fluencyScore)
              : null,
          }
        : null,
    });
  } catch (error) {
    console.error("Get hifz error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const instituteId = session.user.instituteId;
    const body = await req.json();
    const {
      studentId,
      type,
      surahNumber,
      ayahFrom,
      ayahTo,
      lines,
      rating,
      errorCount,
      teacherNote,
      fluency,
    } = body;

    if (!studentId || !type || !surahNumber || !ayahFrom || !ayahTo) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, instituteId, programType: ProgramType.HIFZ },
    });

    if (!student) {
      return NextResponse.json({ error: "Hifz student not found" }, { status: 404 });
    }

    const teacher = await prisma.teacher.findFirst({
      where: { userId: session.user.id, instituteId },
    });

    const surahNum = parseInt(String(surahNumber), 10);
    const record = await prisma.hifzRecord.create({
      data: {
        date: new Date(),
        type: type as HifzType,
        surahNumber: surahNum,
        surahName: getSurahName(surahNum),
        ayahFrom: parseInt(String(ayahFrom), 10),
        ayahTo: parseInt(String(ayahTo), 10),
        lines: lines ? parseInt(String(lines), 10) : null,
        rating: parseInt(String(rating || 5), 10),
        errorCount: parseInt(String(errorCount || 0), 10),
        fluencyScore: fluency ? parseFloat(String(fluency)) : null,
        teacherNote: teacherNote || null,
        studentId,
        teacherId: teacher?.id ?? null,
        juzNumber: student.currentJuz ?? null,
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("Create hifz record error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
