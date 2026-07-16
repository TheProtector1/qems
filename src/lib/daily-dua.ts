export const DUA_CATEGORIES = [
  { value: "DAILY", label: "Daily", icon: "🌅", color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50", text: "text-emerald-700" },
  { value: "MORNING", label: "Morning", icon: "🌤️", color: "from-amber-500 to-orange-600", bg: "bg-amber-50", text: "text-amber-700" },
  { value: "EVENING", label: "Evening", icon: "🌙", color: "from-indigo-500 to-violet-600", bg: "bg-indigo-50", text: "text-indigo-700" },
  { value: "FOOD", label: "Food & Drink", icon: "🍽️", color: "from-rose-500 to-pink-600", bg: "bg-rose-50", text: "text-rose-700" },
  { value: "TRAVEL", label: "Travel", icon: "🕌", color: "from-blue-500 to-cyan-600", bg: "bg-blue-50", text: "text-blue-700" },
  { value: "SLEEP", label: "Sleep", icon: "😴", color: "from-slate-500 to-gray-700", bg: "bg-slate-50", text: "text-slate-700" },
  { value: "OTHER", label: "Other", icon: "📖", color: "from-teal-500 to-green-600", bg: "bg-teal-50", text: "text-teal-700" },
] as const;

export const DUA_PRIORITIES = [
  { value: "CRITICAL", label: "Critical", pill: "pill-danger" },
  { value: "HIGH", label: "High", pill: "bg-orange-100 text-orange-700" },
  { value: "MEDIUM", label: "Medium", pill: "pill-info" },
  { value: "OPTIONAL", label: "Optional", pill: "bg-gray-100 text-gray-600" },
] as const;

export const DUA_STATUSES = [
  { value: "PENDING", label: "Not Started", icon: "⏳", pill: "bg-gray-100 text-gray-600", dot: "bg-gray-300" },
  { value: "TAUGHT", label: "Taught", icon: "📖", pill: "pill-info", dot: "bg-blue-500" },
  { value: "COMPLETED", label: "Completed", icon: "✅", pill: "pill-success", dot: "bg-green-500" },
] as const;

export function getDuaCategoryMeta(value: string) {
  return DUA_CATEGORIES.find((c) => c.value === value) || DUA_CATEGORIES[0];
}

export function getDuaPriorityMeta(value: string) {
  return DUA_PRIORITIES.find((p) => p.value === value) || DUA_PRIORITIES[2];
}

export function getDuaStatusMeta(value: string) {
  return DUA_STATUSES.find((s) => s.value === value) || DUA_STATUSES[0];
}

export type DuaRollupStatus = "DONE" | "IN_PROGRESS" | "PENDING" | "NO_CLASSES" | "PAUSED";

/** Duas have no due date, so the rollup never goes OVERDUE. */
export function getDuaRollupStatus(
  stats: { completed: number; taught: number; pending: number; total: number },
  isActive: boolean
): DuaRollupStatus {
  if (!isActive) return "PAUSED";
  if (stats.total === 0) return "NO_CLASSES";
  if (stats.completed === stats.total) return "DONE";
  if (stats.completed > 0 || stats.taught > 0) return "IN_PROGRESS";
  return "PENDING";
}

export const DUA_ROLLUP_LABELS: Record<DuaRollupStatus, { label: string; pill: string }> = {
  DONE: { label: "All classes done", pill: "pill-success" },
  IN_PROGRESS: { label: "In progress", pill: "pill-info" },
  PENDING: { label: "Not started", pill: "bg-gray-100 text-gray-600" },
  NO_CLASSES: { label: "No classes linked", pill: "pill-warning" },
  PAUSED: { label: "Paused", pill: "bg-gray-100 text-gray-500" },
};
