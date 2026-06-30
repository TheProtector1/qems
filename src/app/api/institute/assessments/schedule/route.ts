import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AssessmentType, ProgramType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = ["INSTITUTE_OWNER", "SUPER_ADMIN", "BRANCH_MANAGER", "TEACHER"];
    if (!allowed.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      programType,
      assessmentType,
      startDate,
      teacherId,
      classId,
      maxScore,
      passingScore,
      description,
      endDate,
    } = body;

    if (!title?.trim() || !programType || !startDate) {
      return NextResponse.json({ error: "Title, program type, and date are required" }, { status: 400 });
    }

    const instituteId = session.user.instituteId;

    if (classId) {
      const cls = await prisma.class.findFirst({ where: { id: classId, instituteId } });
      if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (teacherId) {
      const teacher = await prisma.teacher.findFirst({ where: { id: teacherId, instituteId } });
      if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const assessment = await prisma.assessment.create({
      data: {
        title: title.trim(),
        type: (assessmentType as AssessmentType) || AssessmentType.CUSTOM,
        programType: programType as ProgramType,
        startDate: new Date(startDate + "T00:00:00"),
        endDate: endDate ? new Date(endDate + "T00:00:00") : null,
        description: description?.trim() || null,
        maxScore: maxScore ? Number(maxScore) : 100,
        passingScore: passingScore ? Number(passingScore) : 50,
        instituteId,
        teacherId: teacherId || null,
        classId: classId || null,
      },
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        class: { select: { name: true } },
      },
    });

    return NextResponse.json({ success: true, assessment });
  } catch (error) {
    console.error("[ASSESSMENT_SCHEDULE_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
