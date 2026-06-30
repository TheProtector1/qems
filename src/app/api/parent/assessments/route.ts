import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertParentOwnsStudent } from "@/lib/parent-portal-data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: { students: { select: { id: true, fullName: true, studentId: true, instituteId: true } } },
    });

    if (!parent?.students.length) {
      return NextResponse.json({ students: [], results: [], upcoming: [] });
    }

    let childIds = parent.students.map((s) => s.id);
    if (studentId) {
      if (!(await assertParentOwnsStudent(session.user.id, studentId))) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
      }
      childIds = [studentId];
    }

    const [results, upcoming] = await Promise.all([
      prisma.assessmentResult.findMany({
        where: { studentId: { in: childIds } },
        include: {
          student: { select: { id: true, fullName: true } },
          assessment: {
            select: {
              id: true,
              title: true,
              type: true,
              programType: true,
              startDate: true,
              teacher: { include: { user: { select: { name: true } } } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.assessment.findMany({
        where: {
          instituteId: parent.students[0].instituteId,
          isActive: true,
          startDate: { gte: new Date() },
        },
        include: {
          class: { select: { name: true } },
          teacher: { include: { user: { select: { name: true } } } },
        },
        orderBy: { startDate: "asc" },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      students: parent.students,
      results: results.map((r) => ({
        id: r.id,
        studentId: r.studentId,
        studentName: r.student.fullName,
        exam: r.assessment.title,
        programType: r.assessment.programType,
        assessmentType: r.assessment.type,
        grade: r.grade || "—",
        score: Number(r.score),
        isPassed: r.isPassed,
        remarks: r.remarks,
        date: r.assessment.startDate.toLocaleDateString("en-PK", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        examiner: r.assessment.teacher?.user?.name || "—",
      })),
      upcoming: upcoming.map((a) => ({
        id: a.id,
        title: a.title,
        programType: a.programType,
        date: a.startDate.toLocaleDateString("en-PK", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        className: a.class?.name,
        examiner: a.teacher?.user?.name || "—",
      })),
    });
  } catch (error) {
    console.error("[PARENT_ASSESSMENTS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
