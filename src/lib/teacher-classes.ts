import { prisma } from "@/lib/prisma";

export type TeacherClassRow = {
  id: string;
  name: string;
  programType: string;
  studentsCount: number;
};

/** Classes a teacher may mark character tasks for (direct assignment + student enrollments). */
export async function getTeacherAccessibleClassIds(
  teacherId: string,
  instituteId: string
): Promise<Set<string>> {
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

  return new Set([...directClasses.map((c) => c.id), ...enrollmentClassIds]);
}

export async function getTeacherAccessibleClasses(
  teacherId: string,
  instituteId: string
): Promise<TeacherClassRow[]> {
  const allowed = await getTeacherAccessibleClassIds(teacherId, instituteId);
  if (!allowed.size) return [];

  const classes = await prisma.class.findMany({
    where: {
      id: { in: Array.from(allowed) },
      instituteId,
      isActive: true,
    },
    include: {
      _count: { select: { enrollments: { where: { isActive: true } } } },
    },
    orderBy: { name: "asc" },
  });

  return classes.map((c) => ({
    id: c.id,
    name: c.name,
    programType: c.programType,
    studentsCount: c._count.enrollments,
  }));
}

/** Class IDs per teacher for institute-wide progress rollups. */
export async function getClassIdsByTeacherIds(
  teacherIds: string[],
  instituteId: string
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  await Promise.all(
    teacherIds.map(async (teacherId) => {
      const ids = await getTeacherAccessibleClassIds(teacherId, instituteId);
      result.set(teacherId, Array.from(ids));
    })
  );
  return result;
}
