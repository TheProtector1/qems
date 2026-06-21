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

    const [tasks, students] = await Promise.all([
      prisma.characterTask.findMany({
        where: { instituteId },
        include: {
          progress: {
            include: {
              student: {
                select: { id: true, fullName: true, studentId: true }
              },
              teacher: {
                include: {
                  user: {
                    select: { name: true }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.student.findMany({
        where: { instituteId, isActive: true },
        select: { id: true, fullName: true, studentId: true },
        orderBy: { fullName: "asc" }
      })
    ]);

    return NextResponse.json({ tasks, students });
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
