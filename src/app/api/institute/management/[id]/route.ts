import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteCtx) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "INSTITUTE_OWNER" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only institute owners can manage leadership" }, { status: 403 });
    }

    const { id } = await ctx.params;
    const existing = await prisma.instituteManagementMember.findFirst({
      where: { id, instituteId: session.user.instituteId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const body = await req.json();
    const reportsToId = body.reportsToId !== undefined ? body.reportsToId || null : existing.reportsToId;

    if (reportsToId === id) {
      return NextResponse.json({ error: "A member cannot report to themselves" }, { status: 400 });
    }

    if (reportsToId) {
      const manager = await prisma.instituteManagementMember.findFirst({
        where: { id: reportsToId, instituteId: session.user.instituteId },
      });
      if (!manager) {
        return NextResponse.json({ error: "Reporting manager not found" }, { status: 400 });
      }
    }

    const member = await prisma.instituteManagementMember.update({
      where: { id },
      data: {
        ...(body.fullName !== undefined ? { fullName: String(body.fullName).trim() } : {}),
        ...(body.roleTitle !== undefined ? { roleTitle: String(body.roleTitle).trim() } : {}),
        ...(body.email !== undefined ? { email: body.email?.trim() || null } : {}),
        ...(body.phone !== undefined ? { phone: body.phone?.trim() || null } : {}),
        ...(body.department !== undefined ? { department: body.department?.trim() || null } : {}),
        ...(body.qualifications !== undefined ? { qualifications: body.qualifications?.trim() || null } : {}),
        ...(body.bio !== undefined ? { bio: body.bio?.trim() || null } : {}),
        ...(body.photo !== undefined ? { photo: body.photo || null } : {}),
        ...(body.joinDate !== undefined ? { joinDate: body.joinDate ? new Date(body.joinDate) : null } : {}),
        ...(body.reportsToId !== undefined ? { reportsToId } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: Number(body.sortOrder) || 0 } : {}),
        ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
      },
    });

    return NextResponse.json({
      member: {
        ...member,
        joinDate: member.joinDate ? member.joinDate.toISOString().slice(0, 10) : null,
      },
    });
  } catch (error) {
    console.error("[INSTITUTE_MANAGEMENT_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: RouteCtx) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "INSTITUTE_OWNER" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only institute owners can manage leadership" }, { status: 403 });
    }

    const { id } = await ctx.params;
    const existing = await prisma.instituteManagementMember.findFirst({
      where: { id, instituteId: session.user.instituteId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.instituteManagementMember.updateMany({
        where: { reportsToId: id, instituteId: session.user.instituteId },
        data: { reportsToId: existing.reportsToId },
      }),
      prisma.instituteManagementMember.update({
        where: { id },
        data: { isActive: false },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[INSTITUTE_MANAGEMENT_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
