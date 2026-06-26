import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE() {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pending = await prisma.profileChangeRequest.findFirst({
      where: { userId: session.user.id, status: "PENDING" },
    });

    if (!pending) {
      return NextResponse.json({ error: "No pending request to cancel" }, { status: 404 });
    }

    await prisma.profileChangeRequest.update({
      where: { id: pending.id },
      data: { status: "REJECTED", reviewNote: "Cancelled by user", reviewedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel profile request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await prisma.profileChangeRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Profile requests GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
