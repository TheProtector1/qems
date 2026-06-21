import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "INSTITUTE_OWNER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const instituteId = session.user.instituteId;
    if (!instituteId) return new NextResponse("Institute Not Found", { status: 400 });

    const body = await req.json();
    const { title, description, startDate, endDate, type } = body;

    // Check if the event belongs to this institute
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: { id: params.id, instituteId },
    });

    if (!existingEvent) {
      return new NextResponse("Event Not Found or Access Denied", { status: 404 });
    }

    const event = await prisma.calendarEvent.update({
      where: { id: params.id },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        type: type !== undefined ? type : undefined,
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("[CALENDAR_EVENT_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "INSTITUTE_OWNER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const instituteId = session.user.instituteId;
    if (!instituteId) return new NextResponse("Institute Not Found", { status: 400 });

    // Check if the event belongs to this institute
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: { id: params.id, instituteId },
    });

    if (!existingEvent) {
      return new NextResponse("Event Not Found or Access Denied", { status: 404 });
    }

    await prisma.calendarEvent.delete({
      where: { id: params.id },
    });

    return new NextResponse("Success", { status: 200 });
  } catch (error) {
    console.error("[CALENDAR_EVENT_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
