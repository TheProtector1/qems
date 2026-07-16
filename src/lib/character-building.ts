export const CHARACTER_CATEGORIES = [
  { value: "AKHLAAQ", label: "Akhlaaq (Character)", icon: "💎", color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  { value: "ADAB", label: "Adab (Etiquette)", icon: "🤝", color: "from-blue-500 to-indigo-600", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  { value: "RESPONSIBILITY", label: "Responsibility", icon: "📋", color: "from-amber-500 to-orange-600", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  { value: "WORSHIP", label: "Worship & Spirituality", icon: "🕌", color: "from-violet-500 to-purple-600", bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  { value: "SOCIAL", label: "Social & Community", icon: "🌍", color: "from-rose-500 to-pink-600", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
] as const;

export const CHARACTER_PRIORITIES = [
  { value: "CRITICAL", label: "Critical", pill: "pill-danger" },
  { value: "HIGH", label: "High", pill: "bg-orange-100 text-orange-700" },
  { value: "MEDIUM", label: "Medium", pill: "pill-info" },
  { value: "OPTIONAL", label: "Optional", pill: "bg-gray-100 text-gray-600" },
  // Legacy values kept for older tasks
  { value: "NORMAL", label: "Medium", pill: "pill-info" },
  { value: "LOW", label: "Optional", pill: "bg-gray-100 text-gray-600" },
] as const;

export const CHARACTER_ASSESSMENT_METHODS = [
  { value: "OBSERVED", label: "Observed" },
  { value: "PARENT_CONFIRMATION", label: "Parent Confirmation" },
  { value: "STUDENT_REFLECTION", label: "Student Reflection" },
] as const;

export const CHARACTER_DURATIONS = [
  { value: "ONE_WEEK", label: "1 week" },
  { value: "TWO_WEEKS", label: "2 weeks" },
  { value: "ONE_MONTH", label: "1 month" },
] as const;

export const CHARACTER_REPEAT_CYCLES = [
  { value: "ONE_TIME", label: "One-time" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "CONTINUOUS", label: "Continuous" },
] as const;

export const CHARACTER_STATUSES = [
  { value: "PENDING", label: "Not Started", icon: "⏳", pill: "bg-gray-100 text-gray-600", dot: "bg-gray-300" },
  { value: "TAUGHT", label: "Taught", icon: "📖", pill: "pill-info", dot: "bg-blue-500" },
  { value: "COMPLETED", label: "Completed", icon: "✅", pill: "pill-success", dot: "bg-green-500" },
] as const;

export type CharacterCategory = (typeof CHARACTER_CATEGORIES)[number]["value"];
export type CharacterPriority = (typeof CHARACTER_PRIORITIES)[number]["value"];
export type CharacterProgressStatus = (typeof CHARACTER_STATUSES)[number]["value"];
export type CharacterAssessmentMethod = (typeof CHARACTER_ASSESSMENT_METHODS)[number]["value"];
export type CharacterDuration = (typeof CHARACTER_DURATIONS)[number]["value"];
export type CharacterRepeatCycle = (typeof CHARACTER_REPEAT_CYCLES)[number]["value"];

export const CHARACTER_TASK_EXTRA_FIELDS = [
  "islamicObjective",
  "quranEvidence",
  "hadithEvidence",
  "teacherDeliveryNotes",
  "practicalClassroomActivity",
  "dailyObservationChecklist",
  "homePractice",
  "assessmentMethod",
  "duration",
  "ageGroup",
  "repeatCycle",
  "completionCriteria",
] as const;

export type CharacterTaskExtraField = (typeof CHARACTER_TASK_EXTRA_FIELDS)[number];

export function normalizeCharacterPriority(value?: string | null): string {
  if (!value) return "MEDIUM";
  if (value === "NORMAL") return "MEDIUM";
  if (value === "LOW") return "OPTIONAL";
  return value;
}

export function getCategoryMeta(value: string) {
  return CHARACTER_CATEGORIES.find((c) => c.value === value) || CHARACTER_CATEGORIES[0];
}

export function getStatusMeta(value: string) {
  return CHARACTER_STATUSES.find((s) => s.value === value) || CHARACTER_STATUSES[0];
}

export function getPriorityMeta(value: string) {
  const normalized = normalizeCharacterPriority(value);
  return (
    CHARACTER_PRIORITIES.find((p) => p.value === normalized) ||
    CHARACTER_PRIORITIES.find((p) => p.value === "MEDIUM")!
  );
}

export function getAssessmentMethodMeta(value?: string | null) {
  return CHARACTER_ASSESSMENT_METHODS.find((m) => m.value === value) || null;
}

export function getDurationMeta(value?: string | null) {
  return CHARACTER_DURATIONS.find((d) => d.value === value) || null;
}

export function getRepeatCycleMeta(value?: string | null) {
  return CHARACTER_REPEAT_CYCLES.find((r) => r.value === value) || null;
}

export function progressPercent(completed: number, taught: number, total: number) {
  if (!total) return 0;
  return Math.round(((completed + taught * 0.5) / total) * 100);
}

export function pickCharacterTaskFields(body: Record<string, unknown>) {
  const out: Record<string, string | null> = {};
  for (const key of CHARACTER_TASK_EXTRA_FIELDS) {
    if (body[key] === undefined) continue;
    const value = body[key];
    if (value === null || value === "") {
      out[key] = null;
    } else if (typeof value === "string") {
      out[key] = value.trim() || null;
    }
  }
  if (out.priority === undefined && typeof body.priority === "string") {
    // handled separately by callers
  }
  return out;
}
