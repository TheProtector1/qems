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
