import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

function authorizeInstitute(session: Awaited<ReturnType<typeof getAuthSession>>) {
  if (!session?.user?.instituteId) return null;
  const allowed = ["INSTITUTE_OWNER", "SUPER_ADMIN", "BRANCH_MANAGER"];
  if (!allowed.includes(session.user.role)) return null;
  return session.user.instituteId;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    const instituteId = authorizeInstitute(session);
    if (!instituteId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { title, description, dueDate, isActive, category, priority, teacherIds } = body;

    const existing = await prisma.characterTask.findFirst({
      where: { id: params.id, instituteId },
    });
    if (!existing) return new NextResponse("Not Found", { status: 404 });

    await prisma.$transaction(async (tx) => {
      await tx.characterTask.update({
        where: { id: params.id },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
          ...(isActive !== undefined && { isActive }),
          ...(category !== undefined && { category }),
          ...(priority !== undefined && { priority }),
        },
      });

      if (Array.isArray(teacherIds)) {
        const instituteTeachers = await tx.teacher.findMany({
          where: { instituteId, id: { in: teacherIds }, isActive: true },
          select: { id: true },
        });
        const allowedIds = new Set(instituteTeachers.map((t) => t.id));
        const validIds = teacherIds.filter((id: string) => allowedIds.has(id));

        await tx.characterTaskAssignment.deleteMany({ where: { taskId: params.id } });
        if (validIds.length) {
          await tx.characterTaskAssignment.createMany({
            data: validIds.map((teacherId: string) => ({ taskId: params.id, teacherId })),
            skipDuplicates: true,
          });
        }
      }
    });

    const task = await prisma.characterTask.findUnique({
      where: { id: params.id },
      include: taskInclude,
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("[CHARACTER_TASKS_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const instituteId = authorizeInstitute(await getAuthSession());
    if (!instituteId) return new NextResponse("Unauthorized", { status: 401 });

    const task = await prisma.characterTask.delete({
      where: { id: params.id, instituteId },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("[CHARACTER_TASKS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
