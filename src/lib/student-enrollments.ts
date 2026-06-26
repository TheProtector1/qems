import { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

/** Validate class IDs belong to the institute and return the allowed subset. */
export async function resolveInstituteClassIds(
  tx: Tx,
  instituteId: string,
  classIds: unknown
): Promise<string[]> {
  if (!Array.isArray(classIds) || classIds.length === 0) return [];
  const ids = [
    ...new Set(classIds.filter((id): id is string => typeof id === "string" && id.length > 0)),
  ];
  if (!ids.length) return [];

  const rows = await tx.class.findMany({
    where: { id: { in: ids }, instituteId, isActive: true },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

/** Sync active class enrollments for a student to match the given class IDs. */
export async function syncStudentClassEnrollments(
  tx: Tx,
  studentId: string,
  classIds: string[]
): Promise<void> {
  const existing = await tx.classEnrollment.findMany({
    where: { studentId },
  });

  const targetSet = new Set(classIds);
  const existingByClass = new Map(existing.map((e) => [e.classId, e]));

  for (const row of existing) {
    const shouldBeActive = targetSet.has(row.classId);
    if (row.isActive !== shouldBeActive) {
      await tx.classEnrollment.update({
        where: { id: row.id },
        data: { isActive: shouldBeActive },
      });
    }
  }

  for (const classId of classIds) {
    if (!existingByClass.has(classId)) {
      await tx.classEnrollment.create({
        data: { studentId, classId, isActive: true },
      });
    }
  }
}
