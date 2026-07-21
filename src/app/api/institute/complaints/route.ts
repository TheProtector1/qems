import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ComplaintSeverity, ComplaintStatus } from "@prisma/client";
import { generateCaseNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  "GENERAL",
  "BULLYING",
  "NEGLECT",
  "ABUSE",
  "SAFETY",
  "BEHAVIOUR",
  "WELFARE",
] as const;

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
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    const cases = complaints.map((c) => ({
      id: c.caseNumber,
      dbId: c.id,
      student: c.involvedParties || "—",
      reporter: c.reportedById ? "Staff" : "Institute",
      type: c.title,
      category: c.category,
      severity: severityLabel(c.severity),
      severityRaw: c.severity,
      status: c.status,
      isConfidential: c.isConfidential,
      evidenceNotes: c.evidenceNotes,
      resolution: c.resolution,
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
      categories: CATEGORIES,
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
    const {
      title,
      description,
      severity,
      involvedParties,
      category,
      evidenceNotes,
      studentId,
      isConfidential,
    } = body;

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }

    const complaint = await prisma.complaint.create({
      data: {
        caseNumber: generateCaseNumber(),
        title: title.trim(),
        description: description.trim(),
        category: CATEGORIES.includes(category) ? category : "GENERAL",
        severity: (severity as ComplaintSeverity) || "MEDIUM",
        involvedParties: involvedParties?.trim() || null,
        evidenceNotes: evidenceNotes?.trim() || null,
        studentId: studentId || null,
        isConfidential: isConfidential !== false,
        instituteId: session.user.instituteId,
        reportedById: session.user.id,
        status: "UNDER_INVESTIGATION",
        auditLogs: {
          create: {
            action: "Case opened",
            details: `${title.trim()} [${category || "GENERAL"}]`,
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

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, resolution, evidenceNotes, severity, assignedToId } = body as {
      id?: string;
      status?: ComplaintStatus;
      resolution?: string;
      evidenceNotes?: string;
      severity?: ComplaintSeverity;
      assignedToId?: string | null;
    };

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const existing = await prisma.complaint.findFirst({
      where: { id, instituteId: session.user.instituteId },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const nextStatus = status || existing.status;
    const closing = ["RESOLVED", "CLOSED"].includes(nextStatus);

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        status: nextStatus,
        resolution: resolution !== undefined ? resolution : existing.resolution,
        evidenceNotes: evidenceNotes !== undefined ? evidenceNotes : existing.evidenceNotes,
        severity: severity || existing.severity,
        assignedToId: assignedToId !== undefined ? assignedToId : existing.assignedToId,
        resolvedAt: closing ? existing.resolvedAt || new Date() : null,
        auditLogs: {
          create: {
            action: status ? `Status → ${status}` : "Case updated",
            details: resolution || evidenceNotes || undefined,
            performedBy: session.user.name || session.user.id,
          },
        },
      },
    });

    return NextResponse.json({ success: true, status: updated.status });
  } catch (error) {
    console.error("Patch complaints error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
