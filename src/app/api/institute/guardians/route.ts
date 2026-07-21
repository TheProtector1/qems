import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const STAFF = new Set(["INSTITUTE_OWNER", "BRANCH_MANAGER", "SUPER_ADMIN"]);

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId || !STAFF.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentId = new URL(req.url).searchParams.get("studentId");
    if (!studentId) {
      return NextResponse.json({ error: "studentId required" }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, instituteId: session.user.instituteId },
      select: {
        id: true,
        fullName: true,
        parentId: true,
        parent: {
          select: {
            id: true,
            relation: true,
            user: { select: { id: true, name: true, phone: true, email: true } },
          },
        },
        guardians: {
          include: {
            parent: {
              select: {
                id: true,
                relation: true,
                user: { select: { id: true, name: true, phone: true, email: true } },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const primary = student.parent
      ? {
          parentId: student.parent.id,
          relation: student.parent.relation || "Primary",
          isPrimary: true,
          name: student.parent.user.name,
          phone: student.parent.user.phone,
          email: student.parent.user.email,
          userId: student.parent.user.id,
          linkId: null as string | null,
        }
      : null;

    const additional = student.guardians.map((g) => ({
      parentId: g.parent.id,
      relation: g.relation,
      isPrimary: g.isPrimary,
      canPickup: g.canPickup,
      name: g.parent.user.name,
      phone: g.parent.user.phone,
      email: g.parent.user.email,
      userId: g.parent.user.id,
      linkId: g.id,
    }));

    return NextResponse.json({
      studentId: student.id,
      studentName: student.fullName,
      guardians: [primary, ...additional].filter(Boolean),
    });
  } catch (error) {
    console.error("[GUARDIANS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Link an existing parent user (by phone/email) or create a new guardian login */
export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId || !STAFF.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      studentId,
      name,
      phone,
      email,
      relation,
      password,
    } = body as {
      studentId?: string;
      name?: string;
      phone?: string;
      email?: string;
      relation?: string;
      password?: string;
    };

    if (!studentId || !name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: "studentId, name, and phone are required" }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, instituteId: session.user.instituteId },
      select: { id: true, parentId: true, instituteId: true },
    });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const normalizedPhone = phone.replace(/\D/g, "");
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: phone.trim() },
          { phone: normalizedPhone },
          ...(email ? [{ email: email.trim().toLowerCase() }] : []),
        ],
      },
      include: { parent: true },
    });

    if (!user) {
      const tempPass = password?.trim() || `Guardian@${normalizedPhone.slice(-4) || "1234"}`;
      const hash = await bcrypt.hash(tempPass, 10);
      const syntheticEmail =
        email?.trim().toLowerCase() ||
        `guardian.${normalizedPhone || Date.now()}@qems.local`;

      user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: syntheticEmail,
          phone: phone.trim(),
          password: hash,
          role: "PARENT",
          instituteId: student.instituteId,
          mustChangePassword: true,
          parent: {
            create: { relation: relation?.trim() || "Guardian" },
          },
        },
        include: { parent: true },
      });
    } else if (!user.parent) {
      await prisma.parent.create({
        data: { userId: user.id, relation: relation?.trim() || "Guardian" },
      });
      user = await prisma.user.findUnique({
        where: { id: user.id },
        include: { parent: true },
      });
    }

    if (!user?.parent) {
      return NextResponse.json({ error: "Could not resolve parent profile" }, { status: 500 });
    }

    if (student.parentId === user.parent.id) {
      return NextResponse.json({ error: "Already the primary parent" }, { status: 400 });
    }

    const link = await prisma.studentGuardian.upsert({
      where: {
        studentId_parentId: { studentId: student.id, parentId: user.parent.id },
      },
      create: {
        studentId: student.id,
        parentId: user.parent.id,
        relation: relation?.trim() || user.parent.relation || "Guardian",
        isPrimary: false,
        canPickup: true,
      },
      update: {
        relation: relation?.trim() || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      linkId: link.id,
      parentId: user.parent.id,
      userId: user.id,
    });
  } catch (error) {
    console.error("[GUARDIANS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId || !STAFF.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const linkId = new URL(req.url).searchParams.get("linkId");
    if (!linkId) return NextResponse.json({ error: "linkId required" }, { status: 400 });

    const link = await prisma.studentGuardian.findFirst({
      where: {
        id: linkId,
        student: { instituteId: session.user.instituteId },
      },
    });
    if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.studentGuardian.delete({ where: { id: linkId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[GUARDIANS_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
