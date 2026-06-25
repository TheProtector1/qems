import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.scholarship.findFirst({
      where: { id: params.id, student: { instituteId: session.user.instituteId } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Scholarship not found" }, { status: 404 });
    }

    await prisma.scholarship.update({
      where: { id: params.id },
      data: { isActive: false, endDate: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Revoke scholarship error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
