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
    const { taskId, status, notes, classIds: requestedClassIds } = body;

    if (!taskId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const assignment = await prisma.characterTaskAssignment.findUnique({
      where: { taskId_teacherId: { taskId, teacherId: teacher.id } },
    });
    if (!assignment) {
      return NextResponse.json({ error: "Task not assigned to you" }, { status: 403 });
    }

    const allowed = await getTeacherAccessibleClassIds(teacher.id, teacher.instituteId);
    const targetIds = Array.isArray(requestedClassIds) && requestedClassIds.length
      ? requestedClassIds.filter((id: string) => allowed.has(id))
      : Array.from(allowed);

    if (!targetIds.length) {
      return NextResponse.json({ error: "No classes available to update" }, { status: 400 });
    }

    const now = new Date();
    const results = await prisma.$transaction(
      targetIds.map((classId) =>
        prisma.characterTaskClassProgress.upsert({
          where: { taskId_classId: { taskId, classId } },
          update: {
            status,
            notes: notes !== undefined ? notes : undefined,
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
        })
      )
    );

    return NextResponse.json({
      success: true,
      updated: results.length,
      classIds: targetIds,
    });
  } catch (error) {
    console.error("[TEACHER_CHARACTER_CLASS_PROGRESS_BULK]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
