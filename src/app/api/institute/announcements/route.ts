import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

function targetLabel(roles: Role[]) {
  if (roles.length === 0 || roles.length >= 4) return "All";
  return roles.map((r) => r.replace("_", " ")).join(", ");
}

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const announcements = await prisma.announcement.findMany({
      where: { instituteId: session.user.instituteId },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      announcements: announcements.map((a) => ({
        id: a.id,
        title: a.title,
        target: targetLabel(a.targetRoles),
        content: a.content,
        date: a.createdAt.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
        author: "Administration",
        isPinned: a.isPinned,
      })),
    });
  } catch (error) {
    console.error("Get announcements error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, target } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    let targetRoles: Role[] = [];
    if (target && target !== "All") {
      const map: Record<string, Role[]> = {
        Teachers: [Role.TEACHER],
        Parents: [Role.PARENT],
        Students: [Role.STUDENT],
        "Parents & Students": [Role.PARENT, Role.STUDENT],
      };
      targetRoles = map[target] || [];
    } else {
      targetRoles = [Role.TEACHER, Role.PARENT, Role.STUDENT, Role.INSTITUTE_OWNER];
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        targetRoles,
        instituteId: session.user.instituteId,
        createdById: session.user.id,
      },
    });

    return NextResponse.json({ success: true, announcement });
  } catch (error) {
    console.error("Create announcement error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
