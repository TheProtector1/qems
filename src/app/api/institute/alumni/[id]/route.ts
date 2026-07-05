import { NextResponse } from "next/server";
import { AlumniCompletionType, ProgramType } from "@prisma/client";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeAlumni } from "@/lib/alumni";

export const dynamic = "force-dynamic";

function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "INSTITUTE_OWNER" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only institute owners can manage alumni" }, { status: 403 });
    }

    const existing = await prisma.instituteAlumni.findFirst({
      where: { id: params.id, instituteId: session.user.instituteId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Alumni record not found" }, { status: 404 });
    }

    const body = await req.json();
    const alumni = await prisma.instituteAlumni.update({
      where: { id: params.id },
      data: {
        ...(body.fullName !== undefined ? { fullName: body.fullName.trim() } : {}),
        ...(body.photo !== undefined ? { photo: body.photo || null } : {}),
        ...(body.programType && Object.values(ProgramType).includes(body.programType)
          ? { programType: body.programType }
          : {}),
        ...(body.completionType && Object.values(AlumniCompletionType).includes(body.completionType)
          ? { completionType: body.completionType }
          : {}),
        ...(body.completedAt ? { completedAt: parseDateOnly(body.completedAt) } : {}),
        ...(body.batchYear !== undefined ? { batchYear: body.batchYear || null } : {}),
        ...(body.teacherName !== undefined ? { teacherName: body.teacherName || null } : {}),
        ...(body.occupation !== undefined ? { occupation: body.occupation || null } : {}),
        ...(body.currentStudy !== undefined ? { currentStudy: body.currentStudy || null } : {}),
        ...(body.city !== undefined ? { city: body.city || null } : {}),
        ...(body.achievements !== undefined ? { achievements: body.achievements || null } : {}),
        ...(body.testimonial !== undefined ? { testimonial: body.testimonial || null } : {}),
        ...(body.isFeatured !== undefined ? { isFeatured: Boolean(body.isFeatured) } : {}),
        ...(body.isPublic !== undefined ? { isPublic: Boolean(body.isPublic) } : {}),
      },
    });

    return NextResponse.json({ alumni: serializeAlumni(alumni) });
  } catch (error) {
    console.error("[INSTITUTE_ALUMNI_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "INSTITUTE_OWNER" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only institute owners can manage alumni" }, { status: 403 });
    }

    const existing = await prisma.instituteAlumni.findFirst({
      where: { id: params.id, instituteId: session.user.instituteId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Alumni record not found" }, { status: 404 });
    }

    await prisma.instituteAlumni.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[INSTITUTE_ALUMNI_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
