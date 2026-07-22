/**
 * One-off: mark July 1–19, 2026 attendance for The Quran Garden students.
 * Run: npx tsx scripts/mark-july-attendance.ts
 */
import { PrismaClient, AttendanceStatus } from "@prisma/client";
import { parseDateOnly } from "../src/lib/timezone";
import { fetchActiveHolidays, getHolidayForDate } from "../src/lib/institute-holidays";

const prisma = new PrismaClient();

const INSTITUTE_ID = "cmqgpwpql0001100o4ks63e11";
const YEAR = 2026;
const MONTH = 7; // July
const START_DAY = 1;
const END_DAY = 19;

type DayStatus = AttendanceStatus;

const STUDENTS: Record<
  string,
  {
    id: string;
    skipMode: "sundays" | "holidays";
    defaultStatus: DayStatus;
    overrides: Record<number, DayStatus>;
  }
> = {
  "Muhammad Haris": {
    id: "cmr93sjxn0008i94xvoo1xtgn",
    skipMode: "sundays",
    defaultStatus: "PRESENT",
    overrides: {},
  },
  "Muhammad Hasan": {
    id: "cmqz48zci000nnaknd0b7d19r",
    skipMode: "holidays",
    defaultStatus: "PRESENT",
    overrides: {},
  },
  "Muhammad Moez": {
    id: "cmqz3zmjg0008nakniek5d1vy",
    skipMode: "holidays",
    defaultStatus: "PRESENT",
    overrides: { 10: "ABSENT", 11: "LEAVE" },
  },
  "Hassnain Tanveer": {
    id: "cmr93p7pz0008puobmo10c09x",
    skipMode: "holidays",
    defaultStatus: "PRESENT",
    overrides: { 17: "LEAVE", 18: "LEAVE" },
  },
  "Awais Zahid": {
    id: "cmr955yw4000jd1pfflmttyje",
    skipMode: "holidays",
    defaultStatus: "PRESENT",
    overrides: Object.fromEntries(
      Array.from({ length: 14 }, (_, i) => [i + 2, "ABSENT" as DayStatus])
    ) as Record<number, DayStatus>,
  },
  "Muhammad Sufyan": {
    id: "cmrvtgd3a0008hyjej4owndlp",
    skipMode: "holidays",
    defaultStatus: "PRESENT",
    overrides: {},
  },
  "Raza Hassan": {
    id: "cmr93zakt000yi94xvoqmzlwr",
    skipMode: "holidays",
    defaultStatus: "PRESENT",
    overrides: {},
  },
  "Saad Raza": {
    id: "cmqz36qc6000h45mel62d6ezc",
    skipMode: "holidays",
    defaultStatus: "PRESENT",
    overrides: { 2: "ABSENT", 16: "LEAVE" },
  },
  "Ahmed Waqas": {
    id: "cmr94v9vg0008dvugtbk7sfec",
    skipMode: "holidays",
    defaultStatus: "PRESENT",
    overrides: { 7: "ABSENT", 17: "ABSENT" },
  },
  "Muhammad Ahmed": {
    id: "cmr94yu3u000ndvugtgaxp2x8",
    skipMode: "holidays",
    defaultStatus: "PRESENT",
    overrides: {},
  },
};

function isSunday(date: Date): boolean {
  return date.getUTCDay() === 0;
}

function shouldSkip(
  date: Date,
  day: number,
  skipMode: "sundays" | "holidays",
  holidays: Awaited<ReturnType<typeof fetchActiveHolidays>>
): boolean {
  if (skipMode === "sundays") return isSunday(date);
  return Boolean(getHolidayForDate(holidays, date));
}

async function main() {
  const holidays = await fetchActiveHolidays(INSTITUTE_ID);
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const [name, cfg] of Object.entries(STUDENTS)) {
  for (let day = START_DAY; day <= END_DAY; day++) {
      const date = parseDateOnly(`${YEAR}-${String(MONTH).padStart(2, "0")}-${String(day).padStart(2, "0")}`);

      if (shouldSkip(date, day, cfg.skipMode, holidays)) {
        skipped++;
        continue;
      }

      const status = cfg.overrides[day] ?? cfg.defaultStatus;

      const existing = await prisma.attendance.findFirst({
        where: { studentId: cfg.id, date, classId: null },
      });

      if (existing) {
        await prisma.attendance.update({
          where: { id: existing.id },
          data: {
            status,
            leaveReason: status === "LEAVE" ? "Marked per admin request" : null,
          },
        });
        updated++;
      } else {
        await prisma.attendance.create({
          data: {
            studentId: cfg.id,
            date,
            status,
            classId: null,
            method: "MANUAL",
            leaveReason: status === "LEAVE" ? "Marked per admin request" : null,
          },
        });
        created++;
      }
    }
    console.log(`✓ ${name}`);
  }

  console.log(`\nDone: ${created} created, ${updated} updated, ${skipped} days skipped (Sundays/holidays)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
