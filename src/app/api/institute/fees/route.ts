import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSponsorFundBalances } from "@/lib/sponsor-funds";
import { parseDateOnly, todayDateKey } from "@/lib/timezone";

export const dynamic = "force-dynamic";

function formatMonthLabel(month: string | null) {
  if (!month) return "—";
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
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
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN";
    if (!session.user.instituteId && !isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const instituteId = session.user.instituteId || (isSuperAdmin ? searchParams.get("instituteId") || undefined : undefined);
    const status = searchParams.get("status");
    const month = searchParams.get("month");
    const search = searchParams.get("search")?.trim().toLowerCase();
    const includeSummary = searchParams.get("summary") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "100", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (instituteId) {
      where.student = { instituteId };
    } else if (session.user.role === "BRANCH_MANAGER" && session.user.branchId) {
      where.student = { branchId: session.user.branchId };
    }

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

    const monthWhere: any = {};
    if (instituteId) {
      monthWhere.student = { instituteId };
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
              institute: { select: { name: true, phone: true, email: true, address: true, city: true } },
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
        where: { ...monthWhere, month: { not: null } },
        select: { month: true },
        distinct: ["month"],
        orderBy: { month: "desc" },
      }),
      instituteId
        ? prisma.institute.findUnique({
            where: { id: instituteId },
            select: {
              name: true,
              phone: true,
              email: true,
              address: true,
              city: true,
              logo: true,
            },
          })
        : null,
    ]);

    const sponsorInstituteId = instituteId || (payments[0]?.student?.institute ? undefined : undefined);
    const [instituteSponsors, sponsorBalances] = await Promise.all([
      sponsorInstituteId
        ? prisma.sponsor.findMany({
            where: { instituteId: sponsorInstituteId, isActive: true },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
          })
        : prisma.sponsor.findMany({
            where: { isActive: true },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
            take: 50,
          }),
      sponsorInstituteId
        ? getSponsorFundBalances(sponsorInstituteId)
        : Promise.resolve(new Map<string, number>()),
    ]);

    const distinctMonths = distinctMonthsRaw
      .map((m) => m.month)
      .filter((m): m is string => Boolean(m));

    const currentMonthKey = todayDateKey().slice(0, 7);
    if (!distinctMonths.includes(currentMonthKey)) {
      distinctMonths.unshift(currentMonthKey);
    }

    const fees = payments.map((p) => {
      const studentInst = p.student?.institute;
      return {
        id: p.id,
        invoiceNo: p.invoiceNo,
        studentDbId: p.student?.id,
        student: p.student?.fullName || "Student",
        studentId: p.student?.studentId || "—",
        gender: p.student?.gender,
        program: p.student?.programType || "HIFZ",
        parentName: p.student?.parent?.user?.name || "Parent",
        parentPhone: p.student?.parent?.user?.phone || "",
        parentEmail: p.student?.parent?.user?.email || "",
        month: formatMonthLabel(p.month),
        monthKey: p.month,
        amount: Number(p.netAmount),
        grossAmount: Number(p.amount),
        discount: Number(p.discount),
        currency: p.currency || institute?.currency || studentInst?.currency || "PKR",
        dueDate: p.dueDate.toISOString().slice(0, 10),
        notes: p.notes,
        status: p.status,
        paidAt: p.paidAt ? p.paidAt.toISOString().slice(0, 10) : null,
        method: paymentMethodLabel(p.paymentMethod),
        paymentMethod: p.paymentMethod,
        claimStatus: p.claimStatus,
        sponsorId: p.sponsorId,
        sponsorName: p.sponsor?.name || null,
        availableSponsors: (p.student?.sponsorLinks || []).map((l) => ({
          id: l.sponsor.id,
          name: l.sponsor.name,
          balance: sponsorBalances.get(l.sponsor.id) ?? 0,
        })),
      };
    });

    let summary = null;
    if (includeSummary) {
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

      const summaryWhere: any = {};
      if (instituteId) summaryWhere.student = { instituteId };

      const [paid, unpaid, scholarshipCount, monthlyPayments] = await Promise.all([
        prisma.feePayment.aggregate({
          where: { ...summaryWhere, status: "PAID" },
          _sum: { netAmount: true },
        }),
        prisma.feePayment.aggregate({
          where: { ...summaryWhere, status: { in: ["PENDING", "OVERDUE", "PARTIAL"] } },
          _sum: { netAmount: true },
        }),
        prisma.scholarship.count({
          where: { ...(instituteId ? { student: { instituteId } } : {}), isActive: true },
        }),
        prisma.feePayment.findMany({
          where: {
            ...summaryWhere,
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
        name: institute?.name || payments[0]?.student?.institute?.name || "Islamic Institute",
        phone: institute?.phone || payments[0]?.student?.institute?.phone || "",
        email: institute?.email || payments[0]?.student?.institute?.email || "",
        address: [
          institute?.address || payments[0]?.student?.institute?.address,
          institute?.city || payments[0]?.student?.institute?.city,
        ].filter(Boolean).join(", "),
        city: institute?.city || payments[0]?.student?.institute?.city || "",
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
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN";
    const body = await req.json();
    const instituteId = session.user.instituteId || (isSuperAdmin ? body.instituteId : undefined);

    if (!instituteId && !isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const month = body.month as string;
    const fallbackAmount = Number(body.amount) || 5000;
    const dueDay = Math.min(28, Math.max(1, Number(body.dueDay) || 10));

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "Invalid month format (expected YYYY-MM)" }, { status: 400 });
    }

    const { generateMonthlyFeesForInstitute, generateMonthlyFeesForActiveInstitutes } = await import("@/lib/fee-ops");

    if (instituteId) {
      const result = await generateMonthlyFeesForInstitute({
        instituteId,
        month,
        dueDay,
        fallbackAmount,
      });
      return NextResponse.json({ success: true, ...result });
    } else {
      const results = await generateMonthlyFeesForActiveInstitutes({
        month,
        dueDay,
        fallbackAmount,
      });
      const totalCreated = results.reduce((acc, r) => acc + r.created, 0);
      return NextResponse.json({ success: true, created: totalCreated, results, month });
    }
  } catch (error) {
    console.error("Generate fees error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isStaff =
      session.user.role === "INSTITUTE_OWNER" || session.user.role === "SUPER_ADMIN";
    if (!isStaff) {
      return NextResponse.json({ error: "Only institute owners can delete fee batches" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const instituteId = session.user.instituteId || (session.user.role === "SUPER_ADMIN" ? searchParams.get("instituteId") || undefined : undefined);
    const month = searchParams.get("month");

    const where: any = {};
    if (instituteId) {
      where.student = { instituteId };
    }

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
