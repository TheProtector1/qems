import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import {
  APPROVAL_REQUIRED_FIELDS,
  getProfileApproverType,
  type ProfileField,
} from "@/lib/profile-approvals";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        mustChangePassword: true,
        institute: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const pendingRequest = await prisma.profileChangeRequest.findFirst({
      where: { userId: session.user.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    const approverType = getProfileApproverType(user.role);

    return NextResponse.json({
      profile: user,
      pendingRequest,
      requiresApproval: approverType !== null,
      approverType,
    });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, phone } = body;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const approverType = getProfileApproverType(user.role);
    const requested: Partial<Record<ProfileField, string>> = {};
    const previous: Partial<Record<ProfileField, string | null>> = {};

    if (name !== undefined && name.trim() !== user.name) {
      requested.name = name.trim();
      previous.name = user.name;
    }
    if (email !== undefined && email.trim().toLowerCase() !== user.email) {
      requested.email = email.trim().toLowerCase();
      previous.email = user.email;
    }
    if (phone !== undefined) {
      const normalized = phone ? normalizePhone(phone) : null;
      if (normalized !== (user.phone || null)) {
        requested.phone = normalized || "";
        previous.phone = user.phone;
      }
    }

    const changedFields = Object.keys(requested) as ProfileField[];
    if (changedFields.length === 0) {
      return NextResponse.json({ error: "No changes to submit" }, { status: 400 });
    }

    const invalidField = changedFields.find((f) => !APPROVAL_REQUIRED_FIELDS.includes(f));
    if (invalidField) {
      return NextResponse.json({ error: "Invalid field in request" }, { status: 400 });
    }

    if (requested.email) {
      const existing = await prisma.user.findFirst({
        where: { email: requested.email, NOT: { id: user.id } },
      });
      if (existing) {
        return NextResponse.json({ error: "Email is already in use" }, { status: 400 });
      }
    }

    // Super admin updates apply immediately
    if (!approverType) {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(requested.name ? { name: requested.name } : {}),
          ...(requested.email ? { email: requested.email } : {}),
          ...(requested.phone !== undefined
            ? { phone: requested.phone || null }
            : {}),
        },
      });
      const { password: _p, ...safe } = updated;
      return NextResponse.json({ success: true, profile: safe, applied: true });
    }

    const existingPending = await prisma.profileChangeRequest.findFirst({
      where: { userId: user.id, status: "PENDING" },
    });
    if (existingPending) {
      return NextResponse.json(
        { error: "You already have a pending profile change request. Wait for approval or cancel it first." },
        { status: 400 }
      );
    }

    const request = await prisma.profileChangeRequest.create({
      data: {
        userId: user.id,
        instituteId: user.instituteId,
        requestedChanges: requested,
        previousValues: previous,
        approverType,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      applied: false,
      request,
      message: `Your changes were submitted for ${approverType === "SUPER_ADMIN" ? "Super Admin" : "Institute Owner"} approval.`,
    });
  } catch (error) {
    console.error("Profile PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
