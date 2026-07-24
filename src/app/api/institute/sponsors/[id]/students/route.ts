import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

function authorizeStaff(session: Awaited<ReturnType<typeof getAuthSession>>) {
  if (
    !session?.user.instituteId ||
    !["INSTITUTE_OWNER", "BRANCH_MANAGER", "SUPER_ADMIN"].includes(session.user.role)
  ) {
    return null;
  }
  return session.user.instituteId;
}

/** GET linked students for a sponsor */
export async function GET(_req: Request, ctx: RouteCtx) {
  try {
    const instituteId = authorizeStaff(await getAuthSession());
    if (!instituteId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: sponsorId } = await ctx.params;
    const sponsor = await prisma.sponsor.findFirst({
      where: { id: sponsorId, instituteId },
      select: { id: true },
    });
    if (!sponsor) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const links = await prisma.studentSponsor.findMany({
      where: { sponsorId, isActive: true },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            studentId: true,
            programType: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      students: links.map((l) => ({
        linkId: l.id,
        studentId: l.student.id,
        fullName: l.student.fullName,
        studentCode: l.student.studentId,
        programType: l.student.programType,
        isActive: l.student.isActive,
        notes: l.notes,
        startDate: l.startDate.toISOString().slice(0, 10),
      })),
    });
  } catch (error) {
    console.error("[SPONSOR_STUDENTS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Link a student to this sponsor */
export async function POST(req: Request, ctx: RouteCtx) {
  try {
    const instituteId = authorizeStaff(await getAuthSession());
    if (!instituteId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: sponsorId } = await ctx.params;
    const body = await req.json();
    const studentId = body.studentId as string | undefined;
    const notes = (body.notes as string | undefined)?.trim() || null;

    if (!studentId) {
      return NextResponse.json({ error: "studentId required" }, { status: 400 });
    }

    const [sponsor, student] = await Promise.all([
      prisma.sponsor.findFirst({ where: { id: sponsorId, instituteId } }),
      prisma.student.findFirst({
        where: { id: studentId, instituteId },
        select: { id: true, fullName: true, studentId: true },
      }),
    ]);

    if (!sponsor) return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const link = await prisma.studentSponsor.upsert({
      where: { studentId_sponsorId: { studentId, sponsorId } },
      create: { studentId, sponsorId, notes, isActive: true },
      update: { isActive: true, notes: notes ?? undefined },
    });

    return NextResponse.json({ success: true, linkId: link.id, student });
  } catch (error) {
    console.error("[SPONSOR_STUDENTS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Unlink a student (soft: isActive=false) via ?studentId= or ?linkId= */
export async function DELETE(req: Request, ctx: RouteCtx) {
  try {
    const instituteId = authorizeStaff(await getAuthSession());
    if (!instituteId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: sponsorId } = await ctx.params;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const linkId = searchParams.get("linkId");

    const sponsor = await prisma.sponsor.findFirst({
      where: { id: sponsorId, instituteId },
      select: { id: true },
    });
    if (!sponsor) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (linkId) {
      await prisma.studentSponsor.updateMany({
        where: { id: linkId, sponsorId },
        data: { isActive: false },
      });
    } else if (studentId) {
      await prisma.studentSponsor.updateMany({
        where: { studentId, sponsorId },
        data: { isActive: false },
      });
    } else {
      return NextResponse.json({ error: "studentId or linkId required" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SPONSOR_STUDENTS_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
