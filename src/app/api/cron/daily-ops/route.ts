import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { markOverdueFees, remindFeeDues } from "@/lib/fee-ops";

export const dynamic = "force-dynamic";

/**
 * Optional daily ops cron.
 * Secure with CRON_SECRET header: Authorization: Bearer <CRON_SECRET>
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") || "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const institutes = await prisma.institute.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    take: 200,
  });

  const results = [];
  for (const inst of institutes) {
    const marked = await markOverdueFees(inst.id);
    const reminded = await remindFeeDues({ instituteId: inst.id, onlyOverdue: true, limit: 50 });
    results.push({ instituteId: inst.id, name: inst.name, marked, ...reminded });
  }

  return NextResponse.json({ success: true, institutes: results.length, results });
}
