import { CheckCircle2, X, Clock, AlertTriangle, Palmtree } from "lucide-react";
import { daysInMonth, parseDateOnly } from "@/lib/timezone";

export type AttStatus = "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "HOLIDAY";

export const ATTENDANCE_STATUS: Record<
  AttStatus,
  {
    label: string;
    fullLabel: string;
    icon: typeof CheckCircle2;
    pill: string;
    cal: string;
    dot: string;
    gradient: string;
    bg: string;
    text: string;
    border: string;
    btn: string;
  }
> = {
  PRESENT: {
    label: "P",
    fullLabel: "Present",
    icon: CheckCircle2,
    pill: "pill-success",
    cal: "bg-green-100 text-green-700 border-green-200",
    dot: "bg-green-500",
    gradient: "from-green-500 to-emerald-600",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    btn: "bg-green-500 text-white ring-green-300",
  },
  ABSENT: {
    label: "A",
    fullLabel: "Absent",
    icon: X,
    pill: "pill-danger",
    cal: "bg-red-100 text-red-700 border-red-200",
    dot: "bg-red-500",
    gradient: "from-red-500 to-rose-600",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    btn: "bg-red-500 text-white ring-red-300",
  },
  LATE: {
    label: "L",
    fullLabel: "Late",
    icon: Clock,
    pill: "pill-warning",
    cal: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    gradient: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    btn: "bg-amber-500 text-white ring-amber-300",
  },
  LEAVE: {
    label: "LV",
    fullLabel: "Leave",
    icon: AlertTriangle,
    pill: "pill-info",
    cal: "bg-blue-100 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    gradient: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    btn: "bg-blue-500 text-white ring-blue-300",
  },
  HOLIDAY: {
    label: "H",
    fullLabel: "Holiday",
    icon: Palmtree,
    pill: "pill-muted",
    cal: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
    gradient: "from-gray-400 to-gray-500",
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
    btn: "bg-gray-400 text-white ring-gray-300",
  },
};

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type HifzLessonType = "SABAQ" | "SABQI" | "MANZIL";

export const HIFZ_LESSON_META: Record<HifzLessonType, { short: string; label: string }> = {
  SABAQ: { short: "S", label: "Sabaq" },
  SABQI: { short: "Sq", label: "Sabqi" },
  MANZIL: { short: "M", label: "Manzil" },
};

export type DayRecord = {
  id?: string;
  status: AttStatus;
  leaveReason?: string | null;
  leaveRequestedBy?: string | null;
  hifz?: Partial<Record<HifzLessonType, "done" | "not_done">>;
};

export function buildCalendarDays(year: number, month: number) {
  const first = parseDateOnly(`${year}-${String(month).padStart(2, "0")}-01`);
  const lastDay = daysInMonth(year, month);
  const days: Array<{ date: string; day: number; inMonth: boolean }> = [];
  for (let i = 0; i < first.getUTCDay(); i++) days.push({ date: "", day: 0, inMonth: false });
  for (let d = 1; d <= lastDay; d++) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({ date, day: d, inMonth: true });
  }
  return days;
}

export function computeMonthStats(records: Record<string, DayRecord>) {
  const values = Object.values(records);
  const present = values.filter((r) => r.status === "PRESENT").length;
  const absent = values.filter((r) => r.status === "ABSENT").length;
  const late = values.filter((r) => r.status === "LATE").length;
  const leave = values.filter((r) => r.status === "LEAVE").length;
  const holiday = values.filter((r) => r.status === "HOLIDAY").length;
  const marked = values.filter((r) => r.status !== "HOLIDAY").length;
  const rate = marked ? Math.round(((present + late) / marked) * 100) : 0;
  return { present, absent, late, leave, holiday, marked, rate };
}

export function programLabel(type?: string) {
  if (type === "NAZRA") return "Nazra";
  if (type === "TAJWEED") return "Tajweed";
  return "Hifz";
}
