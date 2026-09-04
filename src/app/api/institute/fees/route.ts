import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSponsorFundBalances } from "@/lib/sponsor-funds";
import { parseDateOnly, todayDateKey } from "@/lib/timezone";

export const dynamic = "force-dynamic";

function formatMonthLabel(month: string | null) {
  if (!month) return "—";
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function paymentMethodLabel(method: string | null) {
  if (!method) return null;
  return method
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instituteId = session.user.instituteId;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const month = searchParams.get("month");
    const search = searchParams.get("search")?.trim().toLowerCase();
    const includeSummary = searchParams.get("summary") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "100", 10)));
    const skip = (page - 1) * limit;

    const where: any = {
      student: { instituteId },
    };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (month && month !== "ALL") {
      where.month = month;
    }

    if (search) {
      where.OR = [
        { invoiceNo: { contains: search, mode: "insensitive" } },
        { student: { fullName: { contains: search, mode: "insensitive" } } },
        { student: { studentId: { contains: search, mode: "insensitive" } } },
        { student: { parent: { user: { name: { contains: search, mode: "insensitive" } } } } },
        { student: { parent: { user: { phone: { contains: search, mode: "insensitive" } } } } },
      ];
    }

    const [payments, total, distinctMonthsRaw, institute] = await Promise.all([
      prisma.feePayment.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              studentId: true,
              gender: true,
              programType: true,
              parent: {
                select: {
                  user: {
                    select: {
                      name: true,
                      phone: true,
                      email: true,
                    },
                  },
                },
              },
              sponsorLinks: {
                where: { isActive: true, sponsor: { isActive: true } },
                include: {
                  sponsor: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
          },
          sponsor: { select: { id: true, name: true } },
        },
        orderBy: [{ dueDate: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.feePayment.count({ where }),
      prisma.feePayment.findMany({
        where: { student: { instituteId }, month: { not: null } },
        select: { month: true },
        distinct: ["month"],
        orderBy: { month: "desc" },
      }),
      prisma.institute.findUnique({
        where: { id: instituteId },
        select: {
          name: true,
          phone: true,
          email: true,
          address: true,
          city: true,
          logo: true,
          currency: true,
        },
      }),
    ]);

    const [instituteSponsors, sponsorBalances] = await Promise.all([
      prisma.sponsor.findMany({
        where: { instituteId, isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      getSponsorFundBalances(instituteId),
    ]);

    const distinctMonths = distinctMonthsRaw
      .map((m) => m.month)
      .filter((m): m is string => Boolean(m));

    // Ensure current month is always present in available months list
    const currentMonthKey = todayDateKey().slice(0, 7);
    if (!distinctMonths.includes(currentMonthKey)) {
      distinctMonths.unshift(currentMonthKey);
    }

    const fees = payments.map((p) => ({
      id: p.id,
      invoiceNo: p.invoiceNo,
      studentDbId: p.student.id,
      student: p.student.fullName,
      studentId: p.student.studentId,
      gender: p.student.gender,
      program: p.student.programType,
      parentName: p.student.parent?.user?.name || "Parent",
      parentPhone: p.student.parent?.user?.phone || "",
      parentEmail: p.student.parent?.user?.email || "",
      month: formatMonthLabel(p.month),
      monthKey: p.month,
      amount: Number(p.netAmount),
      grossAmount: Number(p.amount),
      discount: Number(p.discount),
      currency: p.currency || institute?.currency || "PKR",
      dueDate: p.dueDate.toISOString().slice(0, 10),
      notes: p.notes,
      status: p.status,
      paidAt: p.paidAt ? p.paidAt.toISOString().slice(0, 10) : null,
      method: paymentMethodLabel(p.paymentMethod),
      paymentMethod: p.paymentMethod,
      claimStatus: p.claimStatus,
      sponsorId: p.sponsorId,
      sponsorName: p.sponsor?.name || null,
      availableSponsors: p.student.sponsorLinks.map((l) => ({
        id: l.sponsor.id,
        name: l.sponsor.name,
        balance: sponsorBalances.get(l.sponsor.id) ?? 0,
      })),
    }));

    let summary = null;
    if (includeSummary) {
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

      const [paid, unpaid, scholarshipCount, monthlyPayments] = await Promise.all([
        prisma.feePayment.aggregate({
          where: { student: { instituteId }, status: "PAID" },
          _sum: { netAmount: true },
        }),
        prisma.feePayment.aggregate({
          where: { student: { instituteId }, status: { in: ["PENDING", "OVERDUE", "PARTIAL"] } },
          _sum: { netAmount: true },
        }),
        prisma.scholarship.count({
          where: { student: { instituteId }, isActive: true },
        }),
        prisma.feePayment.findMany({
          where: {
            student: { instituteId },
            createdAt: { gte: sixMonthsAgo },
          },
          select: { month: true, status: true, netAmount: true },
        }),
      ]);

      const trendMap = new Map<string, { collected: number; outstanding: number }>();
      for (const p of monthlyPayments) {
        const key = p.month || "unknown";
        if (!trendMap.has(key)) trendMap.set(key, { collected: 0, outstanding: 0 });
        const entry = trendMap.get(key)!;
        const amt = Number(p.netAmount);
        if (p.status === "PAID") entry.collected += amt;
        else entry.outstanding += amt;
      }

      const revenueData = Array.from(trendMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([mKey, data]) => ({
          month: formatMonthLabel(mKey).split(" ")[0],
          monthKey: mKey,
          collected: data.collected,
          outstanding: data.outstanding,
        }));

      const totalFees = total;
      const paidCount = await prisma.feePayment.count({
        where: { ...where, status: "PAID" },
      });

      summary = {
        totalCollected: Number(paid._sum.netAmount || 0),
        totalOutstanding: Number(unpaid._sum.netAmount || 0),
        collectionRate: totalFees > 0 ? Math.round((paidCount / totalFees) * 100) : 0,
        scholarshipCount,
        revenueData,
      };
    }

    return NextResponse.json({
      fees,
      distinctMonths,
      institute: {
        name: institute?.name || "Islamic Institute",
        phone: institute?.phone || "",
        email: institute?.email || "",
        address: [institute?.address, institute?.city].filter(Boolean).join(", "),
        city: institute?.city || "",
        logo: institute?.logo || null,
        currency: institute?.currency || "PKR",
      },
      sponsors: instituteSponsors.map((sponsor) => ({
        id: sponsor.id,
        name: sponsor.name,
        balance: sponsorBalances.get(sponsor.id) ?? 0,
      })),
      summary,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Get fees error:", error);
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
    const month = body.month as string;
    const fallbackAmount = Number(body.amount) || 5000;
    const dueDay = Math.min(28, Math.max(1, Number(body.dueDay) || 10));

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "Invalid month format (expected YYYY-MM)" }, { status: 400 });
    }

    const [y, m] = month.split("-").map(Number);
    const dueDate = new Date(y, m - 1, dueDay);
    const today = parseDateOnly(todayDateKey());

    // Only active students (excluding dismissed/terminated/withdrawn)
    const [students, feeStructures] = await Promise.all([
      prisma.student.findMany({
        where: {
          instituteId,
          isActive: true,
          status: { in: ["ACTIVE", "ON_LEAVE"] },
        },
        select: {
          id: true,
          studentId: true,
          fullName: true,
          programType: true,
          scholarships: {
            where: { isActive: true },
            select: {
              amount: true,
              percentage: true,
              isFullScholarship: true,
              isActive: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      }),
      prisma.feeStructure.findMany({
        where: { instituteId, isActive: true },
        select: { programType: true, amount: true },
      }),
    ]);

    const { notifyParentOfStudent } = await import("@/lib/notifications");
    const { NotificationType } = await import("@prisma/client");
    const { resolveBaseFeeAmount, computeNetFee } = await import("@/lib/fee-billing");

    const studentIds = students.map((s) => s.id);
    const existing = await prisma.feePayment.findMany({
      where: { studentId: { in: studentIds }, month },
      select: { studentId: true },
    });
    const billedStudentIds = new Set(existing.map((e) => e.studentId));

    // Get current month's invoice sequence count for clean numbering
    const currentMonthCount = await prisma.feePayment.count({
      where: { month, student: { instituteId } },
    });

    let seq = currentMonthCount + 1;
    const toCreate: Array<{
      studentId: string;
      month: string;
      dueDate: Date;
      amount: number;
      discount: number;
      netAmount: number;
      status: "PENDING" | "OVERDUE" | "WAIVED";
      invoiceNo: string;
    }> = [];
    const notifyTargets: Array<{ studentId: string; netAmount: number }> = [];

    const monthNumStr = month.replace("-", "");

    for (const student of students) {
      if (billedStudentIds.has(student.id)) continue;

      const baseAmount = resolveBaseFeeAmount(student.programType, feeStructures, fallbackAmount);
      const { amount: gross, discount, netAmount, waived } = computeNetFee(
        baseAmount,
        student.scholarships,
        dueDate
      );

      const status = waived
        ? "WAIVED"
        : dueDate < today
        ? "OVERDUE"
        : "PENDING";

      const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const invoiceNo = `INV-${monthNumStr}-${String(seq).padStart(3, "0")}-${randSuffix}`;
      seq += 1;

      toCreate.push({
        studentId: student.id,
        month,
        dueDate,
        amount: gross,
        discount,
        netAmount,
        status,
        invoiceNo,
      });

      if (!waived) {
        notifyTargets.push({ studentId: student.id, netAmount });
      }
    }

    if (toCreate.length) {
      await prisma.feePayment.createMany({ data: toCreate });
    }

    if (notifyTargets.length) {
      const dueLabel = dueDate.toLocaleDateString("en-PK", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const monthLabel = formatMonthLabel(month);
      void Promise.all(
        notifyTargets.map(({ studentId, netAmount }) =>
          notifyParentOfStudent(studentId, {
            type: NotificationType.FEE_DUE,
            title: "Fee invoice generated",
            message: `Tuition fee for ${monthLabel} is due on ${dueLabel}. Amount: PKR ${netAmount.toLocaleString()}.`,
            data: { studentId, month },
          })
        )
      );
    }

    const created = toCreate.length;
    const totalEligible = students.length;
    const alreadyBilled = existing.length;

    return NextResponse.json({
      success: true,
      created,
      alreadyBilled,
      totalEligible,
      month,
    });
  } catch (error) {
    console.error("Generate fees error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isStaff =
      session.user.role === "INSTITUTE_OWNER" || session.user.role === "SUPER_ADMIN";
    if (!isStaff) {
      return NextResponse.json({ error: "Only institute owners can delete fee batches" }, { status: 403 });
    }

    const instituteId = session.user.instituteId;
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");

    const where: any = {
      student: { instituteId },
    };

    if (month && month !== "ALL") {
      where.month = month;
    }

    const result = await prisma.feePayment.deleteMany({ where });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      month: month || "ALL",
    });
  } catch (error) {
    console.error("Delete fees error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
