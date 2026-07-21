import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export type ScheduleSlot = {
  day: string;
  startTime: string;
  endTime: string;
  subject?: string;
  room?: string;
};

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

function normalizeSchedule(raw: unknown): ScheduleSlot[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => {
      const slot = s as ScheduleSlot;
      if (!slot?.day || !slot?.startTime || !slot?.endTime) return null;
      return {
        day: String(slot.day).toUpperCase(),
        startTime: slot.startTime,
        endTime: slot.endTime,
        subject: slot.subject || undefined,
        room: slot.room || undefined,
      };
    })
    .filter(Boolean) as ScheduleSlot[];
}

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const instituteId = session.user.instituteId;

    if (session.user.role === "PARENT") {
      const parent = await prisma.parent.findUnique({
        where: { userId: session.user.id },
        select: {
          students: {
            where: { isActive: true },
            select: {
              id: true,
              fullName: true,
              enrollments: {
                where: { isActive: true },
                include: {
                  class: {
                    select: {
                      id: true,
                      name: true,
                      schedule: true,
                      teacher: { include: { user: { select: { name: true } } } },
                    },
                  },
                },
              },
            },
          },
          guardianships: {
            select: {
              student: {
                select: {
                  id: true,
                  fullName: true,
                  isActive: true,
                  enrollments: {
                    where: { isActive: true },
                    include: {
                      class: {
                        select: {
                          id: true,
                          name: true,
                          schedule: true,
                          teacher: { include: { user: { select: { name: true } } } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const children = [
        ...(parent?.students || []),
        ...(parent?.guardianships.map((g) => g.student).filter((s) => s.isActive) || []),
      ];
      const seen = new Set<string>();
      const unique = children.filter((c) => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      });

      return NextResponse.json({
        days: DAYS,
        timetable: unique.flatMap((child) =>
          child.enrollments.map((e) => ({
            studentId: child.id,
            studentName: child.fullName,
            classId: e.class.id,
            className: e.class.name,
            teacherName: e.class.teacher?.user?.name || null,
            schedule: normalizeSchedule(e.class.schedule),
          }))
        ),
      });
    }

    if (!instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where = classId
      ? { id: classId, instituteId }
      : { instituteId, isActive: true };

    const classes = await prisma.class.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        programType: true,
        schedule: true,
        teacher: { include: { user: { select: { name: true } } } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      days: DAYS,
      classes: classes.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        programType: c.programType,
        teacherName: c.teacher?.user?.name || null,
        enrollmentCount: c._count.enrollments,
        schedule: normalizeSchedule(c.schedule),
      })),
    });
  } catch (error) {
    console.error("[TIMETABLE_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getAuthSession();
    if (
      !session?.user.instituteId ||
      !["INSTITUTE_OWNER", "BRANCH_MANAGER", "SUPER_ADMIN", "TEACHER"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { classId, schedule } = body as { classId?: string; schedule?: ScheduleSlot[] };
    if (!classId || !Array.isArray(schedule)) {
      return NextResponse.json({ error: "classId and schedule[] required" }, { status: 400 });
    }

    const cls = await prisma.class.findFirst({
      where: { id: classId, instituteId: session.user.instituteId },
      select: { id: true },
    });
    if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    const normalized = normalizeSchedule(schedule);
    const updated = await prisma.class.update({
      where: { id: classId },
      data: { schedule: normalized },
      select: { id: true, name: true, schedule: true },
    });

    return NextResponse.json({
      success: true,
      class: {
        id: updated.id,
        name: updated.name,
        schedule: normalizeSchedule(updated.schedule),
      },
    });
  } catch (error) {
    console.error("[TIMETABLE_PUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
