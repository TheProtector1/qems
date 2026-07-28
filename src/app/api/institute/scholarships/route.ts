import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instituteId = session.user.instituteId;

    const [scholarships, totalStudents, latestFees] = await Promise.all([
      prisma.scholarship.findMany({
        where: { student: { instituteId }, isActive: true },
        include: {
          student: { select: { fullName: true, studentId: true, programType: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.student.count({ where: { instituteId, isActive: true } }),
      prisma.feePayment.findMany({
        where: { student: { instituteId } },
        select: { studentId: true, amount: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const feeByStudent = new Map<string, number>();
    for (const f of latestFees) {
      if (!feeByStudent.has(f.studentId)) {
        feeByStudent.set(f.studentId, Number(f.amount));
      }
    }

    const rows = scholarships.map((s) => {
      const originalFee = feeByStudent.get(s.studentId) ?? Number(s.amount);
      const pct = s.isFullScholarship
        ? 100
        : s.percentage
          ? Number(s.percentage)
          : originalFee > 0
            ? Math.round((Number(s.amount) / originalFee) * 100)
            : 0;
      const discountFee = s.isFullScholarship
        ? 0
        : Math.max(0, originalFee - Number(s.amount));

      return {
        id: s.id,
        studentName: s.student.fullName,
        studentId: s.student.studentId,
        type: s.isFullScholarship ? "Full (100%)" : `Partial (${pct}%)`,
        program: s.student.programType,
        originalFee,
        discountFee,
        reason: s.reason || s.name,
      };
    });

    const monthlySubsidy = rows.reduce((sum, s) => sum + (s.originalFee - s.discountFee), 0);
    const scholarshipRatio =
      totalStudents > 0 ? Math.round((scholarships.length / totalStudents) * 1000) / 10 : 0;

    return NextResponse.json({
      scholarships: rows,
      summary: { monthlySubsidy, scholarshipRatio, activeCount: scholarships.length },
    });
  } catch (error) {
    console.error("Get scholarships error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instituteId = session.user.instituteId;
    const body = await req.json();
    const studentId = String(body.studentId || "").trim();
    const name = String(body.name || "").trim();
    const reason = String(body.reason || "").trim() || null;
    const startDateRaw = String(body.startDate || "").trim();
    const percentage =
      body.percentage === "" || body.percentage === undefined || body.percentage === null
        ? null
        : Number(body.percentage);
    const amount =
      body.amount === "" || body.amount === undefined || body.amount === null
        ? null
        : Number(body.amount);
    const isFullScholarship = Boolean(body.isFullScholarship);

    if (!studentId || !name || !startDateRaw) {
      return NextResponse.json(
        { error: "Student, scholarship name, and start date are required" },
        { status: 400 }
      );
    }

    if (!isFullScholarship && percentage === null && amount === null) {
      return NextResponse.json(
        { error: "Provide either a percentage or amount for the scholarship" },
        { status: 400 }
      );
    }

    if (percentage !== null && (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100)) {
      return NextResponse.json({ error: "Percentage must be between 1 and 100" }, { status: 400 });
    }

    if (amount !== null && (!Number.isFinite(amount) || amount < 0)) {
      return NextResponse.json({ error: "Amount must be zero or greater" }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, instituteId },
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    await prisma.scholarship.updateMany({
      where: { studentId, isActive: true },
      data: { isActive: false, endDate: new Date(startDateRaw) },
    });

    const scholarship = await prisma.scholarship.create({
      data: {
        studentId,
        name,
        reason,
        startDate: new Date(startDateRaw),
        isActive: true,
        isFullScholarship,
        percentage: isFullScholarship ? null : percentage,
        amount: isFullScholarship ? 0 : amount ?? 0,
      },
    });

    return NextResponse.json({
      success: true,
      scholarship: {
        ...scholarship,
        amount: Number(scholarship.amount),
        percentage: scholarship.percentage ? Number(scholarship.percentage) : null,
      },
    });
  } catch (error) {
    console.error("Create scholarship error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
