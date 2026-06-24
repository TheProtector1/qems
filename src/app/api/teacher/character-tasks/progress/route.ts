import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["PENDING", "TAUGHT", "COMPLETED"];

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "TEACHER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: { students: { select: { id: true } } },
    });
    if (!teacher) return new NextResponse("Teacher Not Found", { status: 404 });

    const body = await req.json();
    const { taskId, studentId, status, notes } = body;

    if (!taskId || !studentId || !status) {
      return new NextResponse("Missing required fields", { status: 400 });
    }
    if (!VALID_STATUSES.includes(status)) {
      return new NextResponse("Invalid status", { status: 400 });
    }

    const ownsStudent = teacher.students.some((s) => s.id === studentId);
    if (!ownsStudent) {
      return new NextResponse("Student not assigned to you", { status: 403 });
    }

    const assignment = await prisma.characterTaskAssignment.findUnique({
      where: { taskId_teacherId: { taskId, teacherId: teacher.id } },
    });
    if (!assignment) {
      return new NextResponse("Task not assigned to you", { status: 403 });
    }

    const now = new Date();
    const progress = await prisma.characterTaskProgress.upsert({
      where: { taskId_studentId: { taskId, studentId } },
      update: {
        status,
        notes: notes !== undefined ? notes : null,
        teacherId: teacher.id,
        taughtAt: status === "TAUGHT" || status === "COMPLETED" ? now : null,
        completedAt: status === "COMPLETED" ? now : null,
      },
      create: {
        taskId,
        studentId,
        status,
        notes: notes || null,
        teacherId: teacher.id,
        taughtAt: status === "TAUGHT" || status === "COMPLETED" ? now : null,
        completedAt: status === "COMPLETED" ? now : null,
      },
      include: {
        student: { select: { id: true, fullName: true, studentId: true } },
      },
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error("[TEACHER_CHARACTER_TASKS_PROGRESS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
