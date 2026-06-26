import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeacherAccessibleClassIds } from "@/lib/teacher-classes";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["PENDING", "TAUGHT", "COMPLETED"];

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const body = await req.json();
    const { taskId, classId, status, notes } = body;

    if (!taskId || !classId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const allowedClassIds = await getTeacherAccessibleClassIds(teacher.id, teacher.instituteId);
    if (!allowedClassIds.has(classId)) {
      return NextResponse.json({ error: "Class not assigned to you" }, { status: 403 });
    }

    const assignment = await prisma.characterTaskAssignment.findUnique({
      where: { taskId_teacherId: { taskId, teacherId: teacher.id } },
    });
    if (!assignment) {
      return NextResponse.json({ error: "Task not assigned to you" }, { status: 403 });
    }

    const now = new Date();
    const progress = await prisma.characterTaskClassProgress.upsert({
      where: { taskId_classId: { taskId, classId } },
      update: {
        status,
        notes: notes !== undefined ? notes : null,
        teacherId: teacher.id,
        taughtAt: status === "TAUGHT" || status === "COMPLETED" ? now : null,
        completedAt: status === "COMPLETED" ? now : null,
      },
      create: {
        taskId,
        classId,
        status,
        notes: notes || null,
        teacherId: teacher.id,
        taughtAt: status === "TAUGHT" || status === "COMPLETED" ? now : null,
        completedAt: status === "COMPLETED" ? now : null,
      },
      include: {
        class: { select: { id: true, name: true, programType: true } },
      },
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error("[TEACHER_CHARACTER_CLASS_PROGRESS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
