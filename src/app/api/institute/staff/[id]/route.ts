import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = params;
    const body = await req.json();
    const { name, staffRole, phone, salary, isActive, image } = body;

    const existing = await prisma.user.findFirst({
      where: { id, instituteId: session.user.instituteId, role: "STAFF" },
    });
    if (!existing) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(staffRole !== undefined && { staffRole }),
        ...(phone !== undefined && { phone }),
        ...(salary !== undefined && { salary: salary ? parseFloat(salary) : null }),
        ...(typeof isActive === "boolean" && { isActive }),
        ...(image !== undefined && { image: image || null }),
      },
    });
    return NextResponse.json({ success: true, staff: updated });
  } catch (error: any) {
    console.error("Update staff error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = params;
    const existing = await prisma.user.findFirst({
      where: { id, instituteId: session.user.instituteId, role: "STAFF" },
    });
    if (!existing) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Staff member deleted" });
  } catch (error: any) {
    console.error("Delete staff error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
