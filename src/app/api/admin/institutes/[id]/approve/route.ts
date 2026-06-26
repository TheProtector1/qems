import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const institute = await prisma.institute.update({
      where: { id: params.id },
      data: { isApproved: true, isActive: true, approvedAt: new Date() },
    });

    return NextResponse.json({ success: true, institute });
  } catch (error) {
    console.error("Approve institute error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
