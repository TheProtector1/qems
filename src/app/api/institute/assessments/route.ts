import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getTeacherScope, isStudentAssignedToTeacher } from "@/lib/teacher-scope";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instituteId = session.user.instituteId;

    let assessmentWhere: Prisma.AssessmentWhereInput = { instituteId };
    let studentWhere: Prisma.StudentWhereInput = { instituteId, isActive: true };
    let resultWhere: Prisma.AssessmentResultWhereInput = { assessment: { instituteId } };

    if (session.user.role === "TEACHER") {
      const teacherScope = await getTeacherScope(session.user.id, instituteId);
      if (!teacherScope.teacher) {
        return NextResponse.json({ exams: [], grades: [], chartData: [], students: [] });
      }

      assessmentWhere = {
        instituteId,
        OR: [
          { teacherId: teacherScope.teacher.id },
          ...(teacherScope.teacherClassIds.length
            ? [{ classId: { in: teacherScope.teacherClassIds } }]
            : []),
          { teacherId: null, classId: null },
        ],
      };

      studentWhere = {
        AND: [
          { instituteId, isActive: true },
          teacherScope.studentWhere,
        ],
      };

      resultWhere = {
        studentId: { in: teacherScope.studentIds },
        assessment: { instituteId },
      };
    }

    const [assessments, results, students] = await Promise.all([
      prisma.assessment.findMany({
        where: assessmentWhere,
        include: {
          teacher: { include: { user: { select: { name: true } } } },
          class: { select: { name: true } },
        },
        orderBy: { startDate: "desc" },
      }),
      prisma.assessmentResult.findMany({
        where: resultWhere,
        include: {
          student: { select: { id: true, fullName: true } },
          assessment: { select: { id: true, title: true, type: true, startDate: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.student.findMany({
        where: studentWhere,
        select: {
          id: true,
          fullName: true,
          enrollments: { include: { class: { select: { name: true } } }, take: 1 },
        },
        orderBy: { fullName: "asc" },
      }),
    ]);

    const now = new Date();
    const exams = assessments.map((a) => ({
      id: a.id,
      name: a.title,
      date: a.startDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      type: a.programType,
      status: a.endDate && a.endDate < now ? "COMPLETED" : a.startDate > now ? "UPCOMING" : "IN_PROGRESS",
      examiner: a.teacher?.user?.name || "—",
      className: a.class?.name,
    }));

    const grades = results.map((r) => ({
      id: r.id,
      student: r.student.fullName,
      exam: r.assessment.title,
      type: r.assessment.type,
      grade: r.grade || "—",
      score: `${Number(r.score)}%`,
      examiner: "—",
      date: r.assessment.startDate.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    }));

    const chartData = results.slice(0, 10).map((r) => ({
      student: r.student.fullName.split(" ")[0],
      score: Number(r.score),
    }));

    return NextResponse.json({
      exams,
      grades,
      chartData,
      students: students.map((s) => ({
        id: s.id,
        name: s.fullName,
        class: s.enrollments[0]?.class?.name || "—",
      })),
    });
  } catch (error) {
    console.error("Get assessments error:", error);
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
    const { studentId, assessmentId, mistakeCount, fluency, tajweed, remarks } = body;

    if (!studentId || !assessmentId) {
      return NextResponse.json({ error: "Student and assessment are required" }, { status: 400 });
    }

    const assessment = await prisma.assessment.findFirst({
      where: { id: assessmentId, instituteId },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    if (session.user.role === "TEACHER") {
      const teacher = await prisma.teacher.findFirst({
        where: { userId: session.user.id, instituteId },
      });
      if (!teacher) {
        return NextResponse.json({ error: "Teacher profile not found" }, { status: 403 });
      }
      const assigned = await isStudentAssignedToTeacher(studentId, teacher.id, instituteId);
      if (!assigned) {
        return NextResponse.json({ error: "You are not assigned to this student" }, { status: 403 });
      }
    }

    const totalDeductions = Number(mistakeCount || 0) * 2;
    const finalScore = Math.max(0, 100 - totalDeductions);

    let grade = "F";
    if (finalScore >= 95) grade = "A+";
    else if (finalScore >= 90) grade = "A";
    else if (finalScore >= 85) grade = "B+";
    else if (finalScore >= 80) grade = "B";
    else if (finalScore >= 70) grade = "C";
    else if (finalScore >= 60) grade = "D";

    const result = await prisma.assessmentResult.upsert({
      where: { assessmentId_studentId: { assessmentId, studentId } },
      create: {
        assessmentId,
        studentId,
        mistakeCount: Number(mistakeCount || 0),
        score: finalScore,
        grade,
        fluencyScore: fluency ? Number(fluency) : null,
        tajweedScore: tajweed ? Number(tajweed) : null,
        remarks: remarks || null,
        isPassed: finalScore >= Number(assessment.passingScore),
      },
      update: {
        mistakeCount: Number(mistakeCount || 0),
        score: finalScore,
        grade,
        fluencyScore: fluency ? Number(fluency) : null,
        tajweedScore: tajweed ? Number(tajweed) : null,
        remarks: remarks || null,
        isPassed: finalScore >= Number(assessment.passingScore),
      },
    });

    const { notifyParentOfStudent } = await import("@/lib/notifications");
    const { NotificationType } = await import("@prisma/client");
    await notifyParentOfStudent(studentId, {
      type: NotificationType.EXAM_RESULT,
      title: "Exam result published",
      message: `Result for "${assessment.title}": ${grade} (${finalScore}%).`,
      data: { assessmentId, studentId, resultId: result.id },
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Create assessment result error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
