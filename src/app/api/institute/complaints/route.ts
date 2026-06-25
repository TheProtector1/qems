import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ComplaintSeverity } from "@prisma/client";
import { generateCaseNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

function severityLabel(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instituteId = session.user.instituteId;
    const yearStart = new Date(new Date().getFullYear(), 0, 1);

    const complaints = await prisma.complaint.findMany({
      where: { instituteId },
      include: {
        auditLogs: { orderBy: { createdAt: "desc" }, take: 10 },
      },
      orderBy: { createdAt: "desc" },
    });

    const cases = complaints.map((c) => ({
      id: c.caseNumber,
      dbId: c.id,
      student: c.involvedParties || "—",
      reporter: c.reportedById ? "Staff" : "Institute",
      type: c.title,
      severity: severityLabel(c.severity),
      status: c.status,
      date: c.createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      desc: c.description,
      auditLogs: c.auditLogs.map((log) => ({
        text: log.action + (log.details ? `: ${log.details}` : ""),
        date: log.createdAt.toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
      })),
    }));

    const activeCount = complaints.filter((c) => !["RESOLVED", "CLOSED"].includes(c.status)).length;
    const resolvedYtd = complaints.filter(
      (c) => ["RESOLVED", "CLOSED"].includes(c.status) && c.createdAt >= yearStart
    ).length;

    const allLogs = complaints
      .flatMap((c) =>
        c.auditLogs.map((log) => ({
          text: `${c.caseNumber}: ${log.action}${log.details ? ` — ${log.details}` : ""}`,
          date: log.createdAt.toLocaleString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }),
        }))
      )
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 20);

    return NextResponse.json({
      cases,
      summary: { activeCount, resolvedYtd, compliant: activeCount === 0 },
      logs: allLogs,
    });
  } catch (error) {
    console.error("Get complaints error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, severity, involvedParties } = body;

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }

    const complaint = await prisma.complaint.create({
      data: {
        caseNumber: generateCaseNumber(),
        title: title.trim(),
        description: description.trim(),
        severity: (severity as ComplaintSeverity) || "MEDIUM",
        involvedParties: involvedParties?.trim() || null,
        instituteId: session.user.instituteId,
        reportedById: session.user.id,
        status: "UNDER_INVESTIGATION",
        auditLogs: {
          create: {
            action: "Case opened",
            details: title.trim(),
            performedBy: session.user.name || session.user.id,
          },
        },
      },
    });

    return NextResponse.json({ success: true, complaint });
  } catch (error) {
    console.error("Create complaint error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
