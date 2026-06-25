import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tickets = await prisma.supportTicket.findMany({
      include: { institute: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      tickets: tickets.map((t) => ({
        id: t.ticketNo,
        subject: t.subject,
        sender: t.institute?.name || "Platform User",
        priority: t.priority,
        status: t.status,
        date: t.createdAt.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
      })),
    });
  } catch (error) {
    console.error("Get support tickets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
