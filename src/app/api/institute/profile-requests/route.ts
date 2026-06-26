import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canApproveProfileRequest } from "@/lib/profile-approvals";
import { normalizePhone } from "@/lib/phone";
import type { ProfileField } from "@/lib/profile-approvals";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId || session.user.role !== "INSTITUTE_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await prisma.profileChangeRequest.findMany({
      where: {
        instituteId: session.user.instituteId,
        approverType: "INSTITUTE_OWNER",
        status: "PENDING",
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Institute profile requests GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId || !canApproveProfileRequest(session.user.role, "INSTITUTE_OWNER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, action, reviewNote } = body;

    if (!id || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const changeRequest = await prisma.profileChangeRequest.findFirst({
      where: {
        id,
        instituteId: session.user.instituteId,
        approverType: "INSTITUTE_OWNER",
        status: "PENDING",
      },
      include: { user: true },
    });

    if (!changeRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (action === "reject") {
      const updated = await prisma.profileChangeRequest.update({
        where: { id },
        data: {
          status: "REJECTED",
          reviewedById: session.user.id,
          reviewedAt: new Date(),
          reviewNote: reviewNote || null,
        },
      });
      return NextResponse.json({ success: true, request: updated });
    }

    const changes = changeRequest.requestedChanges as Record<ProfileField, string>;

    if (changes.email) {
      const existing = await prisma.user.findFirst({
        where: { email: changes.email, NOT: { id: changeRequest.userId } },
      });
      if (existing) {
        return NextResponse.json({ error: "Requested email is already in use" }, { status: 400 });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: changeRequest.userId },
        data: {
          ...(changes.name ? { name: changes.name } : {}),
          ...(changes.email ? { email: changes.email, emailVerified: new Date() } : {}),
          ...(changes.phone !== undefined
            ? { phone: changes.phone ? normalizePhone(changes.phone) : null }
            : {}),
        },
      });

      const updated = await tx.profileChangeRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedById: session.user.id,
          reviewedAt: new Date(),
          reviewNote: reviewNote || null,
        },
      });

      return updated;
    });

    return NextResponse.json({ success: true, request: result });
  } catch (error) {
    console.error("Institute profile request PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
