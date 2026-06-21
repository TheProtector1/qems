import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "TEACHER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });
    if (!teacher) return new NextResponse("Teacher Not Found", { status: 404 });

    const body = await req.json();
    const { taskId, studentId, status, notes } = body;

    if (!taskId || !studentId || !status) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const progress = await prisma.characterTaskProgress.upsert({
      where: {
        taskId_studentId: {
          taskId,
          studentId,
        }
      },
      update: {
        status,
        notes: notes !== undefined ? notes : null,
        completedAt: status === "COMPLETED" ? new Date() : null,
        teacherId: teacher.id,
      },
      create: {
        taskId,
        studentId,
        status,
        notes: notes || null,
        completedAt: status === "COMPLETED" ? new Date() : null,
        teacherId: teacher.id,
      }
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error("[TEACHER_CHARACTER_TASKS_PROGRESS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
