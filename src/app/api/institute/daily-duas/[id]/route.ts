import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const duaInclude = {
  assignments: {
    include: {
      teacher: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
  },
  classProgress: {
    include: {
      class: { select: { id: true, name: true, programType: true } },
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
    const {
      title,
      arabicText,
      urduTranslation,
      transliteration,
      reference,
      notes,
      isActive,
      category,
      priority,
      teacherIds,
    } = body;

    const existing = await prisma.dailyDua.findFirst({
      where: { id: params.id, instituteId },
    });
    if (!existing) return new NextResponse("Not Found", { status: 404 });

    await prisma.$transaction(async (tx) => {
      await tx.dailyDua.update({
        where: { id: params.id },
        data: {
          ...(title !== undefined && { title }),
          ...(arabicText !== undefined && { arabicText }),
          ...(urduTranslation !== undefined && { urduTranslation }),
          ...(transliteration !== undefined && { transliteration: transliteration || null }),
          ...(reference !== undefined && { reference: reference || null }),
          ...(notes !== undefined && { notes: notes || null }),
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

        await tx.dailyDuaAssignment.deleteMany({ where: { duaId: params.id } });
        if (validIds.length) {
          await tx.dailyDuaAssignment.createMany({
            data: validIds.map((teacherId: string) => ({ duaId: params.id, teacherId })),
            skipDuplicates: true,
          });
        }
      }
    });

    const dua = await prisma.dailyDua.findUnique({
      where: { id: params.id },
      include: duaInclude,
    });

    return NextResponse.json(dua);
  } catch (error) {
    console.error("[DAILY_DUAS_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const instituteId = authorizeInstitute(await getAuthSession());
    if (!instituteId) return new NextResponse("Unauthorized", { status: 401 });

    const dua = await prisma.dailyDua.delete({
      where: { id: params.id, instituteId },
    });

    return NextResponse.json(dua);
  } catch (error) {
    console.error("[DAILY_DUAS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
