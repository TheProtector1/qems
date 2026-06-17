import { AuditAudience, Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type AuditAction = "CREATE" | "UPDATE" | "DELETE";

type CreateAuditLogInput = {
  entityType: string;
  entityId: string;
  entityLabel?: string;
  action: AuditAction;
  details?: Record<string, unknown>;
  performedById: string;
  performerRole: Role;
  instituteId?: string | null;
};

export function getAuditAudience(role: Role): AuditAudience | null {
  if (role === "TEACHER" || role === "BRANCH_MANAGER") {
    return AuditAudience.INSTITUTE_OWNER;
  }
  if (role === "INSTITUTE_OWNER") {
    return AuditAudience.SUPER_ADMIN;
  }
  return null;
}

export function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: string[]
): Array<{ field: string; from: unknown; to: unknown }> {
  const changes: Array<{ field: string; from: unknown; to: unknown }> = [];

  for (const field of fields) {
    const prev = before[field];
    const next = after[field];
    const prevNorm = prev instanceof Date ? prev.toISOString() : prev;
    const nextNorm = next instanceof Date ? next.toISOString() : next;

    if (prevNorm !== nextNorm) {
      if (field === "photo") {
        changes.push({ field, from: prev ? "set" : "none", to: next ? "updated" : "removed" });
      } else {
        changes.push({ field, from: prevNorm ?? null, to: nextNorm ?? null });
      }
    }
  }

  return changes;
}

export async function createAuditLog(input: CreateAuditLogInput) {
  const audience = getAuditAudience(input.performerRole);
  if (!audience) return null;

  return prisma.auditLog.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      entityLabel: input.entityLabel,
      action: input.action,
      details: input.details ? JSON.stringify(input.details) : null,
      performedById: input.performedById,
      performerRole: input.performerRole,
      instituteId: input.instituteId ?? null,
      audience,
    },
    include: {
      performedBy: { select: { id: true, name: true, role: true } },
    },
  });
}

export type AuditLogWithPerformer = Prisma.AuditLogGetPayload<{
  include: { performedBy: { select: { id: true; name: true; role: true } } };
}>;
