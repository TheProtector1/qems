import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProgramType } from "@prisma/client";
import { getSurahName } from "@/lib/utils";

export const dynamic = "force-dynamic";

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
        currentJuz: true,
        currentPara: true,
        hifzDirection: true,
        hifzCompletedAt: true,
        targetCompletionDate: true,
        programType: true,
      },
    });

    if (!student || student.programType !== ProgramType.HIFZ) {
      return NextResponse.json({ error: "Hifz profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    const [paraCompletions, records, qualityAgg] = await Promise.all([
      prisma.hifzParaCompletion.findMany({
        where: { studentId: student.id },
        include: { markedBy: { include: { user: { select: { name: true } } } } },
        orderBy: { paraNumber: "asc" },
      }),
      prisma.hifzRecord.findMany({
        where: { studentId: student.id },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: limit,
      }),
      prisma.hifzRecord.aggregate({
        where: { studentId: student.id },
        _avg: { rating: true, fluencyScore: true },
      }),
    ]);

    return NextResponse.json({
      students: [
        {
          ...student,
          hifzCompletedAt: student.hifzCompletedAt?.toISOString() ?? null,
          paraCompletions: paraCompletions.map((c) => ({
            id: c.id,
            paraNumber: c.paraNumber,
            completedAt: c.completedAt.toISOString().slice(0, 10),
            daysToComplete: c.daysToComplete,
            notes: c.notes,
            markedByName: c.markedBy?.user?.name ?? null,
          })),
        },
      ],
      records: records.map((r) => ({
        id: r.id,
        studentId: r.studentId,
        studentName: student.fullName,
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
      quality: {
        avgRating: qualityAgg._avg.rating ?? 0,
        avgFluency: qualityAgg._avg.fluencyScore ? Number(qualityAgg._avg.fluencyScore) : null,
      },
    });
  } catch (error) {
    console.error("[STUDENT_HIFZ_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
