import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildHifzRevisionPlan } from "@/lib/hifz-revision";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    if (!["INSTITUTE_OWNER", "BRANCH_MANAGER", "TEACHER", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let teacherId: string | null = null;
    if (role === "TEACHER") {
      const teacher = await prisma.teacher.findFirst({
        where: { userId: session.user.id },
        select: { id: true },
      });
      teacherId = teacher?.id ?? null;
      if (!teacherId) return NextResponse.json({ items: [] });
    }

    const limit = Math.min(
      80,
      parseInt(new URL(req.url).searchParams.get("limit") || "40", 10)
    );

    const items = await buildHifzRevisionPlan({
      instituteId: session.user.instituteId,
      teacherId,
      limit,
    });

    const summary = {
      critical: items.filter((i) => i.priority === "critical").length,
      high: items.filter((i) => i.priority === "high").length,
      medium: items.filter((i) => i.priority === "medium").length,
    };

    return NextResponse.json({ items, summary });
  } catch (error) {
    console.error("[HIFZ_REVISION_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
