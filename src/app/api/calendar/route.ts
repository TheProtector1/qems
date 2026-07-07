import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dateKeyFromStored } from "@/lib/timezone";

export const dynamic = "force-dynamic";

function serializeEvents(
  events: Array<{
    id: string;
    title: string;
    description: string | null;
    startDate: Date;
    endDate: Date;
    type: "HOLIDAY" | "EXAM" | "EVENT" | "ACADEMIC";
  }>
) {
  return events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    startDate: dateKeyFromStored(event.startDate),
    endDate: dateKeyFromStored(event.endDate),
    type: event.type,
  }));
}

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let instituteId = session.user.instituteId;

    if (!instituteId) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          instituteId: true,
          teacher: { select: { instituteId: true } },
          student: { select: { instituteId: true } },
          parent: {
            select: {
              students: {
                take: 1,
                select: { instituteId: true },
              },
            },
          },
        },
      });

      if (user) {
        instituteId = user.instituteId || 
                      user.teacher?.instituteId || 
                      user.student?.instituteId || 
                      user.parent?.students[0]?.instituteId ||
                      null;
      }
    }

    if (!instituteId) {
      return new NextResponse("Institute Not Found", { status: 400 });
    }

    const events = await prisma.calendarEvent.findMany({
      where: { instituteId },
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json(serializeEvents(events));
  } catch (error) {
    console.error("[CALENDAR_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
