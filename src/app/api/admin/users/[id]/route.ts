import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { normalizePhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

async function requireSuperAdmin() {
  const session = await getAuthSession();
  if (!session || session.user.role !== "SUPER_ADMIN") return null;
  return session;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await requireSuperAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: { institute: { select: { id: true, name: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { password: _p, ...safe } = user;
    return NextResponse.json({ user: safe });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await requireSuperAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, phone, role, isActive, instituteId, password, staffRole, salary } = body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email.toLowerCase();
    if (phone !== undefined) data.phone = phone ? normalizePhone(phone) : null;
    if (role !== undefined) data.role = role as Role;
    if (typeof isActive === "boolean") data.isActive = isActive;
    if (instituteId !== undefined) data.instituteId = instituteId || null;
    if (staffRole !== undefined) data.staffRole = staffRole;
    if (salary !== undefined) data.salary = salary;

    if (password) {
      data.password = await bcrypt.hash(password, 12);
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data,
    });

    const { password: _p, ...safe } = user;
    return NextResponse.json({ success: true, user: safe });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSuperAdmin();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (params.id === session.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
