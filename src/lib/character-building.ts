export const CHARACTER_CATEGORIES = [
  { value: "AKHLAAQ", label: "Akhlaaq (Character)", icon: "💎", color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  { value: "ADAB", label: "Adab (Etiquette)", icon: "🤝", color: "from-blue-500 to-indigo-600", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  { value: "RESPONSIBILITY", label: "Responsibility", icon: "📋", color: "from-amber-500 to-orange-600", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  { value: "WORSHIP", label: "Worship & Spirituality", icon: "🕌", color: "from-violet-500 to-purple-600", bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  { value: "SOCIAL", label: "Social & Community", icon: "🌍", color: "from-rose-500 to-pink-600", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
] as const;

export const CHARACTER_PRIORITIES = [
  { value: "HIGH", label: "High Priority", pill: "pill-danger" },
  { value: "NORMAL", label: "Normal", pill: "pill-info" },
  { value: "LOW", label: "Low", pill: "bg-gray-100 text-gray-600" },
] as const;

export const CHARACTER_STATUSES = [
  { value: "PENDING", label: "Not Started", icon: "⏳", pill: "bg-gray-100 text-gray-600", dot: "bg-gray-300" },
  { value: "TAUGHT", label: "Taught", icon: "📖", pill: "pill-info", dot: "bg-blue-500" },
  { value: "COMPLETED", label: "Completed", icon: "✅", pill: "pill-success", dot: "bg-green-500" },
] as const;

export type CharacterCategory = (typeof CHARACTER_CATEGORIES)[number]["value"];
export type CharacterPriority = (typeof CHARACTER_PRIORITIES)[number]["value"];
export type CharacterProgressStatus = (typeof CHARACTER_STATUSES)[number]["value"];

export function getCategoryMeta(value: string) {
  return CHARACTER_CATEGORIES.find((c) => c.value === value) || CHARACTER_CATEGORIES[0];
}

export function getStatusMeta(value: string) {
  return CHARACTER_STATUSES.find((s) => s.value === value) || CHARACTER_STATUSES[0];
}

export function getPriorityMeta(value: string) {
  return CHARACTER_PRIORITIES.find((p) => p.value === value) || CHARACTER_PRIORITIES[1];
}

export function progressPercent(completed: number, taught: number, total: number) {
  if (!total) return 0;
  return Math.round(((completed + taught * 0.5) / total) * 100);
}
