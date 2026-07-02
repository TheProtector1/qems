import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildManagementTree } from "@/lib/org-tree";

export const dynamic = "force-dynamic";

function serializeMember(m: {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  roleTitle: string;
  department: string | null;
  qualifications: string | null;
  bio: string | null;
  photo: string | null;
  joinDate: Date | null;
  sortOrder: number;
  isActive: boolean;
  reportsToId: string | null;
}) {
  return {
    id: m.id,
    fullName: m.fullName,
    email: m.email,
    phone: m.phone,
    roleTitle: m.roleTitle,
    department: m.department,
    qualifications: m.qualifications,
    bio: m.bio,
    photo: m.photo,
    joinDate: m.joinDate ? m.joinDate.toISOString().slice(0, 10) : null,
    sortOrder: m.sortOrder,
    isActive: m.isActive,
    reportsToId: m.reportsToId,
  };
}

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const members = await prisma.instituteManagementMember.findMany({
      where: { instituteId: session.user.instituteId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { fullName: "asc" }],
    });

    const flat = members.map(serializeMember);
    return NextResponse.json({
      members: flat,
      tree: buildManagementTree(flat),
    });
  } catch (error) {
    console.error("[INSTITUTE_MANAGEMENT_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "INSTITUTE_OWNER" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only institute owners can manage leadership" }, { status: 403 });
    }

    const body = await req.json();
    const {
      fullName,
      roleTitle,
      email,
      phone,
      department,
      qualifications,
      bio,
      photo,
      joinDate,
      reportsToId,
      sortOrder,
    } = body;

    if (!fullName?.trim() || !roleTitle?.trim()) {
      return NextResponse.json({ error: "Name and role title are required" }, { status: 400 });
    }

    if (reportsToId) {
      const manager = await prisma.instituteManagementMember.findFirst({
        where: { id: reportsToId, instituteId: session.user.instituteId },
      });
      if (!manager) {
        return NextResponse.json({ error: "Reporting manager not found" }, { status: 400 });
      }
    }

    const member = await prisma.instituteManagementMember.create({
      data: {
        instituteId: session.user.instituteId,
        fullName: fullName.trim(),
        roleTitle: roleTitle.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        department: department?.trim() || null,
        qualifications: qualifications?.trim() || null,
        bio: bio?.trim() || null,
        photo: photo || null,
        joinDate: joinDate ? new Date(joinDate) : null,
        reportsToId: reportsToId || null,
        sortOrder: Number(sortOrder) || 0,
      },
    });

    return NextResponse.json({ member: serializeMember(member) });
  } catch (error) {
    console.error("[INSTITUTE_MANAGEMENT_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
