import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || !session.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const classes = await prisma.class.findMany({
      where: { instituteId: session.user.instituteId },
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ classes });
  } catch (error) {
    console.error("Get classes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { name, programType, capacity, teacherId, meetingLink, meetingPlatform, meetingPassword } = body;
    if (!name || !programType) {
      return NextResponse.json({ error: "Name and program type are required" }, { status: 400 });
    }
    const count = await prisma.class.count({ where: { instituteId: session.user.instituteId } });
    const code = `CLS-${String(count + 1).padStart(3, "0")}`;
    const cls = await prisma.class.create({
      data: {
        name,
        code,
        programType,
        capacity: capacity ? parseInt(capacity) : 30,
        teacherId: teacherId || null,
        meetingLink: meetingLink || null,
        meetingPlatform: meetingPlatform || null,
        meetingPassword: meetingPassword || null,
        instituteId: session.user.instituteId,
      },
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        _count: { select: { enrollments: true } },
      },
    });
    return NextResponse.json({ success: true, class: cls });
  } catch (error: any) {
    console.error("Create class error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
