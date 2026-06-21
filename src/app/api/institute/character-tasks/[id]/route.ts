import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "INSTITUTE_OWNER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title, description, dueDate, isActive } = body;

    const task = await prisma.characterTask.update({
      where: { id: params.id, instituteId: session.user.instituteId! },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("[CHARACTER_TASKS_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "INSTITUTE_OWNER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const task = await prisma.characterTask.delete({
      where: { id: params.id, instituteId: session.user.instituteId! },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("[CHARACTER_TASKS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
