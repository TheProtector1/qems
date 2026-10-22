import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface TeacherScope {
  teacher: {
    id: string;
    userId: string;
    instituteId: string;
  } | null;
  teacherClassIds: string[];
  studentIds: string[];
  studentWhere: Prisma.StudentWhereInput;
}

/**
 * Returns comprehensive scoping data for a teacher user:
 * - teacher record
 * - assigned class IDs (classes where teacherId == teacher.id)
 * - assigned student IDs (direct student.teacherId == teacher.id OR enrolled in teacher's classes)
 * - Prisma StudentWhereInput to filter students
 */
export async function getTeacherScope(userId: string, instituteId: string): Promise<TeacherScope> {
  const teacher = await prisma.teacher.findFirst({
    where: { userId, instituteId },
    select: { id: true, userId: true, instituteId: true },
  });

  if (!teacher) {
    return {
      teacher: null,
      teacherClassIds: [],
      studentIds: [],
      studentWhere: { id: "___no_match___" },
    };
  }

  // Find all classes assigned to this teacher in this institute
  const classes = await prisma.class.findMany({
    where: { teacherId: teacher.id, instituteId },
    select: { id: true },
  });
  const teacherClassIds = classes.map((c) => c.id);

  // Student where clause:
  // Directly assigned to teacher OR actively enrolled in one of teacher's classes
  const studentWhere: Prisma.StudentWhereInput =
    teacherClassIds.length > 0
      ? {
          instituteId,
          OR: [
            { teacherId: teacher.id },
            {
              enrollments: {
                some: {
                  isActive: true,
                  classId: { in: teacherClassIds },
                },
              },
            },
          ],
        }
      : {
          instituteId,
          teacherId: teacher.id,
        };

  // Fetch all assigned student IDs for this teacher
  const assignedStudents = await prisma.student.findMany({
    where: studentWhere,
    select: { id: true },
  });
  const studentIds = assignedStudents.map((s) => s.id);

  return {
    teacher,
    teacherClassIds,
    studentIds,
    studentWhere,
  };
}

/**
 * Checks if a specific student is assigned to a teacher
 * (either directly via student.teacherId or via active class enrollment in teacher's class)
 */
export async function isStudentAssignedToTeacher(
  studentId: string,
  teacherId: string,
  instituteId: string
): Promise<boolean> {
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      instituteId,
      OR: [
        { teacherId },
        {
          enrollments: {
            some: {
              isActive: true,
              class: { teacherId, instituteId },
            },
          },
        },
      ],
    },
    select: { id: true },
  });

  return Boolean(student);
}
