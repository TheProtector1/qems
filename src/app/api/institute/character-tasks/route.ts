import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const taskInclude = {
  assignments: {
    include: {
      teacher: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
  },
  progress: {
    include: {
      student: { select: { id: true, fullName: true, studentId: true } },
      teacher: { include: { user: { select: { name: true } } } },
    },
  },
} as const;

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "INSTITUTE_OWNER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const instituteId = session.user.instituteId;
    if (!instituteId) return new NextResponse("Institute Not Found", { status: 400 });

    const [tasks, students, teachers] = await Promise.all([
      prisma.characterTask.findMany({
        where: { instituteId },
        include: taskInclude,
        orderBy: [{ isActive: "desc" }, { dueDate: "asc" }],
      }),
      prisma.student.findMany({
        where: { instituteId, isActive: true },
        select: { id: true, fullName: true, studentId: true, teacherId: true },
        orderBy: { fullName: "asc" },
      }),
      prisma.teacher.findMany({
        where: { instituteId, isActive: true },
        include: {
          user: { select: { id: true, name: true, image: true } },
          _count: { select: { students: true } },
        },
        orderBy: { user: { name: "asc" } },
      }),
    ]);

    return NextResponse.json({ tasks, students, teachers });
  } catch (error) {
    console.error("[CHARACTER_TASKS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "INSTITUTE_OWNER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const instituteId = session.user.instituteId;
    if (!instituteId) return new NextResponse("Institute Not Found", { status: 400 });

    const body = await req.json();
    const { title, description, dueDate, category, priority, teacherIds } = body;

    if (!title || !dueDate) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const validTeacherIds = Array.isArray(teacherIds)
      ? teacherIds.filter((id: unknown): id is string => typeof id === "string")
      : [];

    const task = await prisma.characterTask.create({
      data: {
        title,
        description: description || null,
        dueDate: new Date(dueDate),
        category: category || "AKHLAAQ",
        priority: priority || "NORMAL",
        instituteId,
        assignments: validTeacherIds.length
          ? {
              create: validTeacherIds.map((teacherId: string) => ({ teacherId })),
            }
          : undefined,
      },
      include: taskInclude,
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("[CHARACTER_TASKS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
