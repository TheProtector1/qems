import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "INSTITUTE_OWNER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const instituteId = session.user.instituteId;
    if (!instituteId) return new NextResponse("Institute Not Found", { status: 400 });

    const tasks = await prisma.characterTask.findMany({
      where: { instituteId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tasks);
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
    const { title, description, dueDate } = body;

    if (!title || !dueDate) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const task = await prisma.characterTask.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        instituteId,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("[CHARACTER_TASKS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
