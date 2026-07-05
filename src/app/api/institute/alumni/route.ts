import { NextResponse } from "next/server";
import { AlumniCompletionType, ProgramType } from "@prisma/client";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createAlumniFromStudent,
  serializeAlumni,
} from "@/lib/alumni";

export const dynamic = "force-dynamic";

function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instituteId = session.user.instituteId;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const program = searchParams.get("program");
    const featured = searchParams.get("featured");
    const year = searchParams.get("year");
    const publicOnly = searchParams.get("publicOnly") === "true";
    const includeCandidates = searchParams.get("candidates") === "true";

    const where: {
      instituteId: string;
      isPublic?: boolean;
      isFeatured?: boolean;
      batchYear?: string;
      programType?: ProgramType;
      OR?: Array<{ fullName?: { contains: string; mode: "insensitive" }; studentIdLabel?: { contains: string; mode: "insensitive" }; city?: { contains: string; mode: "insensitive" } }>;
    } = { instituteId };

    if (publicOnly) where.isPublic = true;
    if (featured === "true") where.isFeatured = true;
    if (year) where.batchYear = year;
    if (program && Object.values(ProgramType).includes(program as ProgramType)) {
      where.programType = program as ProgramType;
    }
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { studentIdLabel: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    const [alumni, total, featuredCount, hifzCount, thisYearCount, candidates] = await Promise.all([
      prisma.instituteAlumni.findMany({
        where,
        orderBy: [{ isFeatured: "desc" }, { completedAt: "desc" }],
      }),
      prisma.instituteAlumni.count({ where: { instituteId } }),
      prisma.instituteAlumni.count({ where: { instituteId, isFeatured: true } }),
      prisma.instituteAlumni.count({
        where: { instituteId, completionType: AlumniCompletionType.HIFZ_FULL },
      }),
      prisma.instituteAlumni.count({
        where: {
          instituteId,
          completedAt: {
            gte: new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1)),
          },
        },
      }),
      includeCandidates
        ? prisma.student.findMany({
            where: {
              instituteId,
              hifzCompletedAt: { not: null },
              alumni: null,
            },
            select: {
              id: true,
              fullName: true,
              studentId: true,
              photo: true,
              programType: true,
              hifzCompletedAt: true,
              city: true,
              teacher: { include: { user: { select: { name: true } } } },
            },
            orderBy: { hifzCompletedAt: "desc" },
            take: 20,
          })
        : Promise.resolve([]),
    ]);

    const batchYears = await prisma.instituteAlumni.findMany({
      where: { instituteId, batchYear: { not: null } },
      select: { batchYear: true },
      distinct: ["batchYear"],
      orderBy: { batchYear: "desc" },
    });

    return NextResponse.json({
      alumni: alumni.map(serializeAlumni),
      summary: {
        total,
        featured: featuredCount,
        hifzCompleters: hifzCount,
        completedThisYear: thisYearCount,
      },
      batchYears: batchYears.map((b) => b.batchYear).filter(Boolean) as string[],
      candidates: candidates.map((s) => ({
        id: s.id,
        fullName: s.fullName,
        studentId: s.studentId,
        photo: s.photo,
        programType: s.programType,
        hifzCompletedAt: s.hifzCompletedAt?.toISOString().slice(0, 10) ?? null,
        city: s.city,
        teacherName: s.teacher?.user?.name ?? null,
      })),
    });
  } catch (error) {
    console.error("[INSTITUTE_ALUMNI_GET]", error);
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
      return NextResponse.json({ error: "Only institute owners can manage alumni" }, { status: 403 });
    }

    const instituteId = session.user.instituteId;
    const body = await req.json();
    const { studentId, ...manual } = body as {
      studentId?: string;
      fullName?: string;
      photo?: string;
      programType?: ProgramType;
      completionType?: AlumniCompletionType;
      completedAt?: string;
      batchYear?: string;
      teacherName?: string;
      occupation?: string;
      currentStudy?: string;
      city?: string;
      achievements?: string;
      testimonial?: string;
      isFeatured?: boolean;
      isPublic?: boolean;
    };

    if (studentId) {
      const alumni = await createAlumniFromStudent(studentId, instituteId, {
        completionType: manual.completionType,
        completedAt: manual.completedAt,
        occupation: manual.occupation,
        currentStudy: manual.currentStudy,
        achievements: manual.achievements,
        testimonial: manual.testimonial,
        isFeatured: manual.isFeatured,
        isPublic: manual.isPublic,
      });
      return NextResponse.json({ alumni: serializeAlumni(alumni) });
    }

    if (!manual.fullName?.trim() || !manual.completedAt) {
      return NextResponse.json({ error: "fullName and completedAt are required" }, { status: 400 });
    }

    const alumni = await prisma.instituteAlumni.create({
      data: {
        instituteId,
        fullName: manual.fullName.trim(),
        photo: manual.photo || null,
        programType: manual.programType ?? ProgramType.HIFZ,
        completionType: manual.completionType ?? AlumniCompletionType.HIFZ_FULL,
        completedAt: parseDateOnly(manual.completedAt),
        batchYear: manual.batchYear ?? manual.completedAt.slice(0, 4),
        teacherName: manual.teacherName?.trim() || null,
        occupation: manual.occupation?.trim() || null,
        currentStudy: manual.currentStudy?.trim() || null,
        city: manual.city?.trim() || null,
        achievements: manual.achievements?.trim() || null,
        testimonial: manual.testimonial?.trim() || null,
        isFeatured: manual.isFeatured ?? false,
        isPublic: manual.isPublic ?? true,
      },
    });

    return NextResponse.json({ alumni: serializeAlumni(alumni) });
  } catch (error) {
    console.error("[INSTITUTE_ALUMNI_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
