import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProgramType, type Prisma } from "@prisma/client";
import { getSurahName } from "@/lib/utils";
import { getTeacherScope, isStudentAssignedToTeacher } from "@/lib/teacher-scope";

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

    const studentConditions: Prisma.StudentWhereInput[] = [
      { instituteId, isActive: true, programType: ProgramType.NAZRA },
    ];

    if (session.user.role === "TEACHER") {
      const teacherScope = await getTeacherScope(session.user.id, instituteId);
      if (!teacherScope.teacher) {
        return NextResponse.json({ students: [], records: [] });
      }
      studentConditions.push(teacherScope.studentWhere);
    }

    const students = await prisma.student.findMany({
      where: { AND: studentConditions },
      select: {
        id: true,
        fullName: true,
        currentPara: true,
        currentPage: true,
        currentSurah: true,
      },
      orderBy: { fullName: "asc" },
    });

    const visibleStudentIds = students.map((s) => s.id);
    if (studentId && session.user.role === "TEACHER" && !visibleStudentIds.includes(studentId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const targetStudentIds = studentId ? [studentId] : visibleStudentIds;

    const records = targetStudentIds.length
      ? await prisma.nazraRecord.findMany({
          where: {
            studentId: { in: targetStudentIds },
          },
          include: { student: { select: { fullName: true } } },
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
          take: limit,
        })
      : [];

    const studentSummaries = students.map((s) => {
      const studentRecords = records.filter((r) => r.studentId === s.id);
      const latest = studentRecords[0];
      const avgFluency =
        studentRecords.length > 0
          ? studentRecords.reduce((sum, r) => sum + r.fluency, 0) / studentRecords.length
          : 0;

      return {
        id: s.id,
        name: s.fullName,
        progress: s.currentPara ? `Para ${s.currentPara}` : s.currentSurah || "Starting",
        qaidaCompleted: (s.currentPage ?? 0) >= 17,
        readingSpeed: avgFluency >= 4 ? "Fast" : avgFluency >= 3 ? "Medium" : "Slow",
        fluency: avgFluency,
        latestRecord: latest
          ? {
              surah: latest.surahName || getSurahName(latest.surahNumber),
              pages: `${latest.pageFrom}-${latest.pageTo}`,
              date: latest.date.toISOString().slice(0, 10),
            }
          : null,
      };
    });

    return NextResponse.json({
      students: studentSummaries,
      records: records.map((r) => ({
        id: r.id,
        studentId: r.studentId,
        student: r.student.fullName,
        surah: r.surahName || getSurahName(r.surahNumber),
        pageFrom: r.pageFrom,
        pageTo: r.pageTo,
        readingAccuracy: Number(r.readingAccuracy),
        tajweedAccuracy: Number(r.tajweedAccuracy),
        fluency: r.fluency,
        teacherNote: r.teacherNote,
        date: r.date.toISOString().slice(0, 10),
        time: r.createdAt.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" }),
      })),
    });
  } catch (error) {
    console.error("Get nazra error:", error);
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
    const { studentId, surahNumber, pageFrom, pageTo, readingAccuracy, tajweedAccuracy, fluency, teacherNote } =
      body;

    if (!studentId || !surahNumber || !pageFrom || !pageTo) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, instituteId, programType: ProgramType.NAZRA },
    });

    if (!student) {
      return NextResponse.json({ error: "Nazra student not found" }, { status: 404 });
    }

    const teacher = await prisma.teacher.findFirst({
      where: { userId: session.user.id, instituteId },
    });

    if (session.user.role === "TEACHER") {
      if (!teacher) {
        return NextResponse.json({ error: "Teacher profile not found" }, { status: 403 });
      }
      const assigned = await isStudentAssignedToTeacher(studentId, teacher.id, instituteId);
      if (!assigned) {
        return NextResponse.json({ error: "You are not assigned to this student" }, { status: 403 });
      }
    }

    const surahNum = parseInt(String(surahNumber), 10);
    const record = await prisma.nazraRecord.create({
      data: {
        date: new Date(),
        surahNumber: surahNum,
        surahName: getSurahName(surahNum),
        pageFrom: parseInt(String(pageFrom), 10),
        pageTo: parseInt(String(pageTo), 10),
        readingAccuracy: parseFloat(String(readingAccuracy || 90)),
        tajweedAccuracy: parseFloat(String(tajweedAccuracy || 85)),
        fluency: parseInt(String(fluency || 3), 10),
        teacherNote: teacherNote || null,
        studentId,
        teacherId: teacher?.id ?? null,
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("Create nazra record error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
