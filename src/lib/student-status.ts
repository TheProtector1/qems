import type { StudentEnrollmentStatus } from "@prisma/client";

export const STUDENT_STATUS_OPTIONS: Array<{
  value: StudentEnrollmentStatus;
  label: string;
  description: string;
}> = [
  { value: "ACTIVE", label: "Active", description: "Currently enrolled and attending" },
  { value: "ON_LEAVE", label: "On Leave", description: "Temporarily away, expected to return" },
  { value: "SUSPENDED", label: "Suspended", description: "Enrollment temporarily suspended" },
  { value: "TERMINATED", label: "Terminated", description: "Enrollment ended by the institute" },
  { value: "DISMISSED", label: "Dismissed", description: "Dismissed for disciplinary reasons" },
  { value: "GRADUATED", label: "Graduated", description: "Completed the program" },
  { value: "TRANSFERRED", label: "Transferred", description: "Transferred to another institute/branch" },
  { value: "WITHDRAWN", label: "Withdrawn", description: "Withdrawn by parent/guardian" },
];

export const STUDENT_STATUS_META: Record<
  StudentEnrollmentStatus,
  { label: string; pill: string; dot: string }
> = {
  ACTIVE: { label: "Active", pill: "pill-success", dot: "bg-green-500" },
  ON_LEAVE: { label: "On Leave", pill: "pill-info", dot: "bg-blue-500" },
  SUSPENDED: { label: "Suspended", pill: "pill-warning", dot: "bg-amber-500" },
  TERMINATED: { label: "Terminated", pill: "pill-danger", dot: "bg-red-500" },
  DISMISSED: { label: "Dismissed", pill: "pill-danger", dot: "bg-red-600" },
  GRADUATED: { label: "Graduated", pill: "pill-primary", dot: "bg-violet-500" },
  TRANSFERRED: { label: "Transferred", pill: "pill-muted", dot: "bg-gray-400" },
  WITHDRAWN: { label: "Withdrawn", pill: "pill-muted", dot: "bg-gray-400" },
};

/** Statuses considered "still enrolled" — kept in sync with Student.isActive. */
export const ACTIVE_STUDENT_STATUSES: StudentEnrollmentStatus[] = ["ACTIVE"];

export function isActiveForStatus(status: StudentEnrollmentStatus): boolean {
  return ACTIVE_STUDENT_STATUSES.includes(status);
}

export function studentStatusLabel(status?: string | null): string {
  if (!status) return STUDENT_STATUS_META.ACTIVE.label;
  return STUDENT_STATUS_META[status as StudentEnrollmentStatus]?.label || status;
}
