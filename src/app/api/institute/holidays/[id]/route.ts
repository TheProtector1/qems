import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HolidayType } from "@prisma/client";
import {
  clearHolidayAttendanceForRange,
  clearWeeklyHolidayAttendance,
  dateKey,
  parseDateOnly,
  syncHolidayAttendanceForRange,
  WEEKDAY_LABELS,
} from "@/lib/institute-holidays";

export const dynamic = "force-dynamic";

function serializeHoliday(h: {
  id: string;
  type: HolidayType;
  name: string;
  dayOfWeek: number | null;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
  notes: string | null;
}) {
  return {
    id: h.id,
    type: h.type,
    name: h.name,
    dayOfWeek: h.dayOfWeek,
    dayLabel: h.dayOfWeek !== null ? WEEKDAY_LABELS[h.dayOfWeek] : null,
    startDate: h.startDate ? dateKey(h.startDate) : null,
    endDate: h.endDate ? dateKey(h.endDate) : null,
    isActive: h.isActive,
    notes: h.notes,
  };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId || session.user.role !== "INSTITUTE_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const instituteId = session.user.instituteId;

    const existing = await prisma.instituteHoliday.findFirst({
      where: { id, instituteId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, startDate, endDate, notes, isActive, syncAttendance } = body as {
      name?: string;
      startDate?: string;
      endDate?: string;
      notes?: string;
      isActive?: boolean;
      syncAttendance?: boolean;
    };

    const data: {
      name?: string;
      startDate?: Date;
      endDate?: Date;
      notes?: string | null;
      isActive?: boolean;
    } = {};

    if (name !== undefined) data.name = name.trim();
    if (notes !== undefined) data.notes = notes || null;
    if (isActive !== undefined) data.isActive = isActive;
    if (startDate) data.startDate = parseDateOnly(startDate);
    if (endDate) data.endDate = parseDateOnly(endDate);

    const holiday = await prisma.instituteHoliday.update({
      where: { id },
      data,
    });

    if (syncAttendance !== false) {
      if (holiday.type === "WEEKLY" && holiday.dayOfWeek !== null && holiday.isActive) {
        const today = new Date();
        const syncStart = new Date(Date.UTC(today.getUTCFullYear() - 1, 0, 1));
        const syncEnd = new Date(Date.UTC(today.getUTCFullYear() + 1, 11, 31));
        await syncHolidayAttendanceForRange(instituteId, syncStart, syncEnd);
      } else if (holiday.startDate && holiday.endDate && holiday.isActive) {
        await syncHolidayAttendanceForRange(instituteId, holiday.startDate, holiday.endDate);
      }
    }

    return NextResponse.json(serializeHoliday(holiday));
  } catch (error) {
    console.error("[INSTITUTE_HOLIDAYS_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId || session.user.role !== "INSTITUTE_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const instituteId = session.user.instituteId;

    const existing = await prisma.instituteHoliday.findFirst({
      where: { id, instituteId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
    }

    await prisma.instituteHoliday.delete({ where: { id } });

    if (existing.type === "WEEKLY" && existing.dayOfWeek !== null) {
      const today = new Date();
      const from = new Date(Date.UTC(today.getUTCFullYear() - 1, 0, 1));
      const to = new Date(Date.UTC(today.getUTCFullYear() + 1, 11, 31));
      await clearWeeklyHolidayAttendance(instituteId, existing.dayOfWeek, from, to);
    } else if (existing.startDate && existing.endDate) {
      await clearHolidayAttendanceForRange(instituteId, existing.startDate, existing.endDate);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[INSTITUTE_HOLIDAYS_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
