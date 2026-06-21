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
    const { name, programType, capacity, teacherId, isActive } = body;

    const existing = await prisma.class.findFirst({
      where: { id, instituteId: session.user.instituteId },
    });
    if (!existing) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    const updated = await prisma.class.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(programType && { programType }),
        ...(capacity !== undefined && { capacity: parseInt(capacity) }),
        ...(teacherId !== undefined && { teacherId: teacherId || null }),
        ...(typeof isActive === "boolean" && { isActive }),
      },
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        _count: { select: { enrollments: true } },
      },
    });
    return NextResponse.json({ success: true, class: updated });
  } catch (error: any) {
    console.error("Update class error:", error);
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

    const existing = await prisma.class.findFirst({
      where: { id, instituteId: session.user.instituteId },
    });
    if (!existing) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    // Cascade: ClassEnrollment and Attendance have onDelete: Cascade / SetNull already in schema
    await prisma.class.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Class deleted" });
  } catch (error: any) {
    console.error("Delete class error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
