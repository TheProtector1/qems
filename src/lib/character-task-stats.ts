export type ClassProgressRow = {
  classId: string;
  status: string;
  notes?: string | null;
  taughtAt?: string | Date | null;
  completedAt?: string | Date | null;
};

export type ClassProgressStats = {
  completed: number;
  taught: number;
  pending: number;
  total: number;
  percent: number;
};

export function computeClassProgressStats(
  classIds: string[],
  classProgress: ClassProgressRow[]
): ClassProgressStats {
  const byClass = new Map(classProgress.map((p) => [p.classId, p]));
  let completed = 0;
  let taught = 0;
  let pending = 0;

  for (const id of classIds) {
    const row = byClass.get(id);
    if (!row || row.status === "PENDING") pending += 1;
    else if (row.status === "COMPLETED") completed += 1;
    else if (row.status === "TAUGHT") taught += 1;
    else pending += 1;
  }

  const total = classIds.length;
  const percent = total ? Math.round(((completed + taught * 0.5) / total) * 100) : 0;
  return { completed, taught, pending, total, percent };
}

export function isTaskOverdue(dueDate: string | Date, isActive = true): boolean {
  if (!isActive) return false;
  const due = new Date(dueDate);
  due.setHours(23, 59, 59, 999);
  return due < new Date();
}

export type TaskRollupStatus =
  | "DONE"
  | "OVERDUE"
  | "IN_PROGRESS"
  | "PENDING"
  | "NO_CLASSES"
  | "PAUSED";

export function getTaskRollupStatus(
  stats: ClassProgressStats,
  dueDate: string | Date,
  isActive: boolean
): TaskRollupStatus {
  if (!isActive) return "PAUSED";
  if (stats.total === 0) return "NO_CLASSES";
  if (stats.completed === stats.total) return "DONE";
  if (isTaskOverdue(dueDate, isActive) && stats.pending > 0) return "OVERDUE";
  if (stats.completed > 0 || stats.taught > 0) return "IN_PROGRESS";
  return "PENDING";
}

export const ROLLUP_LABELS: Record<TaskRollupStatus, { label: string; pill: string }> = {
  DONE: { label: "All classes done", pill: "pill-success" },
  OVERDUE: { label: "Overdue", pill: "pill-danger" },
  IN_PROGRESS: { label: "In progress", pill: "pill-info" },
  PENDING: { label: "Not started", pill: "bg-gray-100 text-gray-600" },
  NO_CLASSES: { label: "No classes linked", pill: "pill-warning" },
  PAUSED: { label: "Paused", pill: "bg-gray-100 text-gray-500" },
};
