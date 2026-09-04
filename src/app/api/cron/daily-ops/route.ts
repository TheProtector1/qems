import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { markOverdueFees, remindFeeDues, generateMonthlyFeesForActiveInstitutes } from "@/lib/fee-ops";
import { todayDateKey } from "@/lib/timezone";

export const dynamic = "force-dynamic";

/**
 * Daily ops cron endpoint.
 * - On the 1st of every month (or if triggerMonthlyBilling=true): automatically generates monthly tuition fee vouchers for all active institutes.
 * - Marks overdue fees for all institutes.
 * - Sends reminders for overdue/pending fees.
 *
 * Secure with CRON_SECRET header: Authorization: Bearer <CRON_SECRET>
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") || "";
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayStr = todayDateKey(); // e.g. "2026-09-01"
  const isFirstOfMonth = todayStr.endsWith("-01");

  const body = await req.json().catch(() => ({}));
  const triggerMonthlyBilling = Boolean(body.triggerMonthlyBilling || isFirstOfMonth);
  const targetMonth = (body.month as string) || todayStr.slice(0, 7);

  let billingResults = null;
  if (triggerMonthlyBilling) {
    billingResults = await generateMonthlyFeesForActiveInstitutes({
      month: targetMonth,
      dueDay: 10,
    });
  }

  const institutes = await prisma.institute.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    take: 200,
  });

  const opsResults = [];
  for (const inst of institutes) {
    const marked = await markOverdueFees(inst.id);
    const reminded = await remindFeeDues({ instituteId: inst.id, onlyOverdue: true, limit: 50 });
    opsResults.push({ instituteId: inst.id, name: inst.name, marked, ...reminded });
  }

  return NextResponse.json({
    success: true,
    today: todayStr,
    autoBilledMonth: triggerMonthlyBilling ? targetMonth : null,
    billingResults,
    institutesCount: institutes.length,
    opsResults,
  });
}

export async function GET(req: Request) {
  // Allow health check or cron GET triggers
  return POST(req);
}
