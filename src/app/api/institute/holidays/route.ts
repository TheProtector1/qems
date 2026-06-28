import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HolidayType } from "@prisma/client";
import {
  dateKey,
  fetchActiveHolidays,
  getWeeklyOffDays,
  parseDateOnly,
  syncHolidayAttendanceForRange,
  WEEKDAY_LABELS,
} from "@/lib/institute-holidays";
import { buildPakistanPublicHolidayDates } from "@/lib/pakistan-public-holidays";

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
  createdAt: Date;
  updatedAt: Date;
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
    createdAt: h.createdAt,
    updatedAt: h.updatedAt,
  };
}

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instituteId = session.user.instituteId;
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");

    const holidays = await prisma.instituteHoliday.findMany({
      where: { instituteId },
      orderBy: [{ type: "asc" }, { dayOfWeek: "asc" }, { startDate: "asc" }],
    });

    const active = holidays.filter((h) => h.isActive);
    const weeklyOffDays = getWeeklyOffDays(active);

    let dateHoliday = null;
    if (dateParam) {
      const { getHolidayForDate } = await import("@/lib/institute-holidays");
      dateHoliday = getHolidayForDate(active, parseDateOnly(dateParam));
    }

    return NextResponse.json({
      holidays: holidays.map(serializeHoliday),
      weeklyOffDays,
      dateHoliday,
    });
  } catch (error) {
    console.error("[INSTITUTE_HOLIDAYS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId || session.user.role !== "INSTITUTE_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instituteId = session.user.instituteId;
    const body = await req.json();
    const { action } = body as { action?: string };

    if (action === "import-pakistan-public") {
      const year = Number(body.year) || new Date().getFullYear();
      const presets = buildPakistanPublicHolidayDates(year);
      const existing = await prisma.instituteHoliday.findMany({
        where: { instituteId, type: "PUBLIC", isActive: true },
      });
      const existingKeys = new Set(
        existing.map((h) => `${h.name}|${h.startDate ? dateKey(h.startDate) : ""}`)
      );

      const created = [];
      for (const preset of presets) {
        const key = `${preset.name}|${preset.startDate}`;
        if (existingKeys.has(key)) continue;

        const holiday = await prisma.instituteHoliday.create({
          data: {
            instituteId,
            type: "PUBLIC",
            name: preset.name,
            startDate: parseDateOnly(preset.startDate),
            endDate: parseDateOnly(preset.endDate),
          },
        });
        created.push(holiday);
      }

      if (created.length > 0) {
        const start = parseDateOnly(`${year}-01-01`);
        const end = parseDateOnly(`${year}-12-31`);
        await syncHolidayAttendanceForRange(instituteId, start, end);
      }

      return NextResponse.json({
        imported: created.length,
        holidays: created.map(serializeHoliday),
      });
    }

    if (action === "set-weekly") {
      const { weeklyOffDays } = body as { weeklyOffDays: number[] };
      if (!Array.isArray(weeklyOffDays)) {
        return NextResponse.json({ error: "weeklyOffDays must be an array" }, { status: 400 });
      }

      const validDays = weeklyOffDays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
      const existing = await prisma.instituteHoliday.findMany({
        where: { instituteId, type: "WEEKLY" },
      });

      const existingByDay = new Map(existing.map((h) => [h.dayOfWeek, h]));
      const results = [];

      for (let day = 0; day <= 6; day++) {
        const shouldBeOff = validDays.includes(day);
        const current = existingByDay.get(day);

        if (shouldBeOff) {
          if (current) {
            if (!current.isActive) {
              const updated = await prisma.instituteHoliday.update({
                where: { id: current.id },
                data: { isActive: true, name: `${WEEKDAY_LABELS[day]} (Weekly Off)` },
              });
              results.push(updated);
            }
          } else {
            const created = await prisma.instituteHoliday.create({
              data: {
                instituteId,
                type: "WEEKLY",
                name: `${WEEKDAY_LABELS[day]} (Weekly Off)`,
                dayOfWeek: day,
              },
            });
            results.push(created);
          }
        } else if (current?.isActive) {
          await prisma.instituteHoliday.update({
            where: { id: current.id },
            data: { isActive: false },
          });
        }
      }

      const today = new Date();
      const syncStart = new Date(Date.UTC(today.getUTCFullYear() - 1, 0, 1));
      const syncEnd = new Date(Date.UTC(today.getUTCFullYear() + 1, 11, 31));
      await syncHolidayAttendanceForRange(instituteId, syncStart, syncEnd);

      const holidays = await fetchActiveHolidays(instituteId);
      return NextResponse.json({
        weeklyOffDays: getWeeklyOffDays(holidays),
        holidays: (await prisma.instituteHoliday.findMany({ where: { instituteId } })).map(serializeHoliday),
      });
    }

    const { type, name, dayOfWeek, startDate, endDate, notes, syncAttendance } = body as {
      type: HolidayType;
      name: string;
      dayOfWeek?: number;
      startDate?: string;
      endDate?: string;
      notes?: string;
      syncAttendance?: boolean;
    };

    if (!type || !name?.trim()) {
      return NextResponse.json({ error: "Type and name are required" }, { status: 400 });
    }

    if (type === "WEEKLY") {
      if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6) {
        return NextResponse.json({ error: "Valid dayOfWeek (0-6) required for weekly holidays" }, { status: 400 });
      }

      const existing = await prisma.instituteHoliday.findFirst({
        where: { instituteId, type: "WEEKLY", dayOfWeek },
      });

      const holiday = existing
        ? await prisma.instituteHoliday.update({
            where: { id: existing.id },
            data: { name: name.trim(), isActive: true, notes: notes || null },
          })
        : await prisma.instituteHoliday.create({
            data: {
              instituteId,
              type: "WEEKLY",
              name: name.trim(),
              dayOfWeek,
              notes: notes || null,
            },
          });

      if (syncAttendance !== false) {
        const today = new Date();
        const syncStart = new Date(Date.UTC(today.getUTCFullYear() - 1, 0, 1));
        const syncEnd = new Date(Date.UTC(today.getUTCFullYear() + 1, 11, 31));
        await syncHolidayAttendanceForRange(instituteId, syncStart, syncEnd);
      }

      return NextResponse.json(serializeHoliday(holiday), { status: 201 });
    }

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "startDate and endDate are required" }, { status: 400 });
    }

    const start = parseDateOnly(startDate);
    const end = parseDateOnly(endDate);
    if (start > end) {
      return NextResponse.json({ error: "startDate must be on or before endDate" }, { status: 400 });
    }

    const holiday = await prisma.instituteHoliday.create({
      data: {
        instituteId,
        type,
        name: name.trim(),
        startDate: start,
        endDate: end,
        notes: notes || null,
      },
    });

    if (syncAttendance !== false) {
      await syncHolidayAttendanceForRange(instituteId, start, end);
    }

    return NextResponse.json(serializeHoliday(holiday), { status: 201 });
  } catch (error) {
    console.error("[INSTITUTE_HOLIDAYS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
