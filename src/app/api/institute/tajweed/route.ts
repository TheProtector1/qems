import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProgramType, type Prisma } from "@prisma/client";
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

    const studentConditions: Prisma.StudentWhereInput[] = [
      { instituteId, isActive: true, programType: ProgramType.TAJWEED },
    ];

    if (session.user.role === "TEACHER") {
      const teacherScope = await getTeacherScope(session.user.id, instituteId);
      if (!teacherScope.teacher) {
        return NextResponse.json({ students: [], rules: [], evaluations: [] });
      }
      studentConditions.push(teacherScope.studentWhere);
    }

    const students = await prisma.student.findMany({
      where: { AND: studentConditions },
      select: { id: true, fullName: true, currentSurah: true },
      orderBy: { fullName: "asc" },
    });

    const visibleStudentIds = students.map((s) => s.id);
    if (studentId && session.user.role === "TEACHER" && !visibleStudentIds.includes(studentId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const targetStudentIds = studentId ? [studentId] : visibleStudentIds;

    const [rules, records] = await Promise.all([
      prisma.tajweedRule.findMany({ orderBy: [{ category: "asc" }, { order: "asc" }] }),
      targetStudentIds.length
        ? prisma.tajweedRecord.findMany({
            where: {
              studentId: { in: targetStudentIds },
            },
            include: { rule: true },
          })
        : [],
    ]);

    const studentSummaries = students.map((s) => {
      const studentRecords = records.filter((r) => r.studentId === s.id);
      const mastered = studentRecords.filter((r) => r.isMastered).length;
      const total = rules.length || 1;

      return {
        id: s.id,
        name: s.fullName,
        progress: s.currentSurah || "Starting",
        masteredCount: mastered,
        totalRules: rules.length,
        masteryPct: Math.round((mastered / total) * 100),
      };
    });

    const evaluations = records.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      ruleId: r.ruleId,
      ruleName: r.rule.ruleName,
      category: r.rule.category,
      isMastered: r.isMastered,
      practiceScore: r.practiceScore,
      notes: r.notes,
      masteredAt: r.masteredAt?.toISOString().slice(0, 10) ?? null,
    }));

    return NextResponse.json({
      students: studentSummaries,
      rules: rules.map((r) => ({
        id: r.id,
        category: r.category,
        ruleName: r.ruleName,
        arabicName: r.arabicName,
        description: r.description,
        order: r.order,
      })),
      evaluations,
    });
  } catch (error) {
    console.error("Get tajweed error:", error);
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
    const { studentId, ruleId, isMastered, practiceScore, notes } = body;

    if (!studentId || !ruleId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, instituteId, programType: ProgramType.TAJWEED },
    });

    if (!student) {
      return NextResponse.json({ error: "Tajweed student not found" }, { status: 404 });
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

    const record = await prisma.tajweedRecord.upsert({
      where: { studentId_ruleId: { studentId, ruleId } },
      create: {
        studentId,
        ruleId,
        isMastered: Boolean(isMastered),
        masteredAt: isMastered ? new Date() : null,
        practiceScore: practiceScore ? parseInt(String(practiceScore), 10) : null,
        notes: notes || null,
        assessedBy: session.user.name || session.user.id,
      },
      update: {
        isMastered: Boolean(isMastered),
        masteredAt: isMastered ? new Date() : null,
        practiceScore: practiceScore ? parseInt(String(practiceScore), 10) : null,
        notes: notes || null,
        assessedBy: session.user.name || session.user.id,
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("Upsert tajweed record error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
