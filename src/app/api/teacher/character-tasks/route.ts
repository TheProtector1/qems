import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "TEACHER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        students: {
          where: { isActive: true },
          select: { id: true, fullName: true, studentId: true }
        }
      }
    });

    if (!teacher) return new NextResponse("Teacher Not Found", { status: 404 });

    // Fetch active tasks for the institute
    const tasks = await prisma.characterTask.findMany({
      where: { instituteId: teacher.instituteId, isActive: true },
      orderBy: { dueDate: "asc" },
      include: {
        progress: {
          where: { studentId: { in: teacher.students.map((s: { id: string }) => s.id) } }
        }
      }
    });

    return NextResponse.json({ tasks, students: teacher.students });
  } catch (error) {
    console.error("[TEACHER_CHARACTER_TASKS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
