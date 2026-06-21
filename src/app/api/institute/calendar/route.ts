import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "INSTITUTE_OWNER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const instituteId = session.user.instituteId;
    if (!instituteId) return new NextResponse("Institute Not Found", { status: 400 });

    const events = await prisma.calendarEvent.findMany({
      where: { instituteId },
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("[INSTITUTE_CALENDAR_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "INSTITUTE_OWNER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const instituteId = session.user.instituteId;
    if (!instituteId) return new NextResponse("Institute Not Found", { status: 400 });

    const body = await req.json();
    const { title, description, startDate, endDate, type } = body;

    if (!title || !startDate || !endDate || !type) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type,
        instituteId,
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("[INSTITUTE_CALENDAR_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
