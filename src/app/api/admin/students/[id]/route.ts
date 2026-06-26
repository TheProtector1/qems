import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Gender, ProgramType } from "@prisma/client";

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

    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        institute: { select: { id: true, name: true } },
        parent: { include: { user: { select: { name: true, email: true, phone: true } } } },
        teacher: { include: { user: { select: { name: true } } } },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({ student });
  } catch (error) {
    console.error("Get student error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await requireSuperAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      fullName, gender, dateOfBirth, address, city, country,
      program, teacherId, isActive, instituteId,
    } = body;

    const data: Record<string, unknown> = {};
    if (fullName !== undefined) data.fullName = fullName;
    if (gender !== undefined) data.gender = gender as Gender;
    if (dateOfBirth !== undefined) data.dateOfBirth = new Date(dateOfBirth);
    if (address !== undefined) data.address = address;
    if (city !== undefined) data.city = city;
    if (country !== undefined) data.country = country;
    if (teacherId !== undefined) data.teacherId = teacherId || null;
    if (typeof isActive === "boolean") data.isActive = isActive;
    if (instituteId !== undefined) data.instituteId = instituteId;

    if (program) {
      let programType: ProgramType = ProgramType.HIFZ;
      if (program.toUpperCase() === "NAZRA") programType = ProgramType.NAZRA;
      if (program.toUpperCase() === "TAJWEED") programType = ProgramType.TAJWEED;
      data.programType = programType;
    }

    const student = await prisma.student.update({
      where: { id: params.id },
      data,
    });

    if (fullName && student.userId) {
      await prisma.user.update({
        where: { id: student.userId },
        data: { name: fullName },
      });
    }

    return NextResponse.json({ success: true, student });
  } catch (error) {
    console.error("Update student error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await requireSuperAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.student.findUnique({ where: { id: params.id } });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (student.userId) {
      await prisma.user.delete({ where: { id: student.userId } });
    } else {
      await prisma.student.delete({ where: { id: params.id } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete student error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
