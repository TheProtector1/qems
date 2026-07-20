import { Role } from "@prisma/client";

export function formatMessageTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffDays === 0) {
    return d.toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-PK", { month: "short", day: "numeric" });
}

export function roleLabel(role: string) {
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const ANNOUNCEMENT_TARGETS: { value: string; label: string; roles: Role[] }[] = [
  {
    value: "All",
    label: "Everyone",
    roles: [Role.TEACHER, Role.PARENT, Role.STUDENT, Role.INSTITUTE_OWNER, Role.BRANCH_MANAGER],
  },
  { value: "Teachers", label: "Teachers", roles: [Role.TEACHER] },
  { value: "Parents", label: "Parents", roles: [Role.PARENT] },
  { value: "Students", label: "Students", roles: [Role.STUDENT] },
  { value: "Parents & Students", label: "Parents & Students", roles: [Role.PARENT, Role.STUDENT] },
  { value: "Staff", label: "Leadership & Staff", roles: [Role.INSTITUTE_OWNER, Role.BRANCH_MANAGER, Role.STAFF] },
];

export function resolveAnnouncementRoles(target?: string): Role[] {
  const found = ANNOUNCEMENT_TARGETS.find((t) => t.value === target);
  return found?.roles ?? ANNOUNCEMENT_TARGETS[0].roles;
}

export function announcementTargetLabel(roles: Role[]) {
  if (!roles.length) return "Everyone";
  const match = ANNOUNCEMENT_TARGETS.find(
    (t) =>
      t.roles.length === roles.length && t.roles.every((r) => roles.includes(r))
  );
  if (match) return match.label;
  return roles.map((r) => roleLabel(r)).join(", ");
}
