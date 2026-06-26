import { prisma } from "@/lib/prisma";

/** Classes a teacher may mark character tasks for (direct assignment + student enrollments). */
export async function getTeacherAccessibleClasses(teacherId: string, instituteId: string) {
  const directClasses = await prisma.class.findMany({
    where: { teacherId, instituteId, isActive: true },
    select: { id: true },
  });

  const teacherStudentIds = await prisma.student.findMany({
    where: { teacherId, instituteId, isActive: true },
    select: { id: true },
  });

  let enrollmentClassIds: string[] = [];
  if (teacherStudentIds.length > 0) {
    const rows = await prisma.classEnrollment.findMany({
      where: {
        isActive: true,
        studentId: { in: teacherStudentIds.map((s) => s.id) },
        class: { instituteId, isActive: true },
      },
      select: { classId: true },
      distinct: ["classId"],
    });
    enrollmentClassIds = rows.map((r) => r.classId);
  }

  const allowed = new Set([
    ...directClasses.map((c) => c.id),
    ...enrollmentClassIds,
  ]);
  return allowed;
}
