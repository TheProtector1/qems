import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, StudentEnrollmentStatus } from "@prisma/client";
import { DISCONTINUED_STATUSES } from "@/lib/student-status";

export const dynamic = "force-dynamic";

function clampPageSize(value: string | null) {
  const parsed = Number.parseInt(value || "20", 10);
  if (!Number.isFinite(parsed)) return 20;
  return Math.min(Math.max(parsed, 1), 50);
}

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN";
    if (!session.user.instituteId && !isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instituteId = session.user.instituteId;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
    const pageSize = clampPageSize(searchParams.get("pageSize"));
    const search = searchParams.get("search")?.trim();
    const statusParam = searchParams.get("status")?.trim().toUpperCase();

    const baseWhere: Prisma.StudentWhereInput = {};
    if (isSuperAdmin && !instituteId) {
      // super admin sees all institutes
    } else {
      baseWhere.instituteId = instituteId!;
    }

    if (session.user.role === "TEACHER" && instituteId) {
      const teacher = await prisma.teacher.findFirst({
        where: { userId: session.user.id, instituteId },
      });
      if (teacher) baseWhere.teacherId = teacher.id;
    }

    if (session.user.role === "BRANCH_MANAGER" && session.user.branchId) {
      baseWhere.branchId = session.user.branchId;
    }

    const statusFilter: StudentEnrollmentStatus[] =
      statusParam && DISCONTINUED_STATUSES.includes(statusParam as StudentEnrollmentStatus)
        ? [statusParam as StudentEnrollmentStatus]
        : DISCONTINUED_STATUSES;

    const whereClause: Prisma.StudentWhereInput = {
      ...baseWhere,
      status: { in: statusFilter },
    };

    if (search) {
      whereClause.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { studentId: { contains: search, mode: "insensitive" } },
      ];
    }

    const select = {
      id: true,
      studentId: true,
      fullName: true,
      photo: true,
      gender: true,
      programType: true,
      status: true,
      statusReason: true,
      retentionAttempts: true,
      statusUpdatedAt: true,
      admissionDate: true,
      teacher: { select: { user: { select: { name: true } } } },
      parent: { select: { user: { select: { name: true, phone: true, email: true } } } },
    } satisfies Prisma.StudentSelect;

    const [students, total, statusCounts] = await Promise.all([
      prisma.student.findMany({
        where: whereClause,
        select,
        orderBy: { statusUpdatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.student.count({ where: whereClause }),
      prisma.student.groupBy({
        by: ["status"],
        where: { ...baseWhere, status: { in: DISCONTINUED_STATUSES } },
        _count: true,
      }),
    ]);

    const summary = {
      total: statusCounts.reduce((sum, row) => sum + row._count, 0),
      terminated: statusCounts.find((r) => r.status === "TERMINATED")?._count ?? 0,
      dismissed: statusCounts.find((r) => r.status === "DISMISSED")?._count ?? 0,
      withdrawn: statusCounts.find((r) => r.status === "WITHDRAWN")?._count ?? 0,
    };

    return NextResponse.json({
      students,
      summary,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (error) {
    console.error("Get discontinued students error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
