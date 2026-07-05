import { AlumniCompletionType, ProgramType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const COMPLETION_TYPE_LABELS: Record<AlumniCompletionType, string> = {
  HIFZ_FULL: "Full Hifz (Quran memorized)",
  NAZRA_COMPLETE: "Nazra complete",
  TAJWEED_CERTIFIED: "Tajweed certified",
  OTHER: "Other completion",
};

export const PROGRAM_LABELS: Record<ProgramType, string> = {
  HIFZ: "Hifz",
  NAZRA: "Nazra",
  TAJWEED: "Tajweed",
  COMBINED: "Combined",
};

export type AlumniPayload = {
  id: string;
  fullName: string;
  photo: string | null;
  gender: string | null;
  programType: string;
  completionType: string;
  completedAt: string;
  batchYear: string | null;
  studentIdLabel: string | null;
  teacherName: string | null;
  totalDaysHifz: number | null;
  occupation: string | null;
  currentStudy: string | null;
  city: string | null;
  achievements: string | null;
  testimonial: string | null;
  isFeatured: boolean;
  isPublic: boolean;
  studentId: string | null;
};

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function serializeAlumni(a: {
  id: string;
  fullName: string;
  photo: string | null;
  gender: string | null;
  programType: string;
  completionType: string;
  completedAt: Date;
  batchYear: string | null;
  studentIdLabel: string | null;
  teacherName: string | null;
  totalDaysHifz: number | null;
  occupation: string | null;
  currentStudy: string | null;
  city: string | null;
  achievements: string | null;
  testimonial: string | null;
  isFeatured: boolean;
  isPublic: boolean;
  studentId: string | null;
}): AlumniPayload {
  return {
    id: a.id,
    fullName: a.fullName,
    photo: a.photo,
    gender: a.gender,
    programType: a.programType,
    completionType: a.completionType,
    completedAt: dateKey(a.completedAt),
    batchYear: a.batchYear,
    studentIdLabel: a.studentIdLabel,
    teacherName: a.teacherName,
    totalDaysHifz: a.totalDaysHifz,
    occupation: a.occupation,
    currentStudy: a.currentStudy,
    city: a.city,
    achievements: a.achievements,
    testimonial: a.testimonial,
    isFeatured: a.isFeatured,
    isPublic: a.isPublic,
    studentId: a.studentId,
  };
}

export async function ensureAlumniFromHifzCompletion(studentId: string, instituteId: string) {
  const existing = await prisma.instituteAlumni.findUnique({ where: { studentId } });
  if (existing) return existing;

  const student = await prisma.student.findFirst({
    where: { id: studentId, instituteId },
    include: {
      teacher: { include: { user: { select: { name: true } } } },
      hifzParaCompletions: { select: { daysToComplete: true } },
    },
  });
  if (!student?.hifzCompletedAt) return null;

  const totalDays = student.hifzParaCompletions.reduce((sum, p) => sum + p.daysToComplete, 0);

  return prisma.instituteAlumni.create({
    data: {
      instituteId,
      studentId,
      fullName: student.fullName,
      photo: student.photo,
      gender: student.gender,
      programType: student.programType,
      completionType: AlumniCompletionType.HIFZ_FULL,
      completedAt: student.hifzCompletedAt,
      batchYear: String(student.hifzCompletedAt.getUTCFullYear()),
      studentIdLabel: student.studentId,
      teacherName: student.teacher?.user?.name ?? null,
      totalDaysHifz: totalDays > 0 ? totalDays : null,
      city: student.city,
      isFeatured: false,
      isPublic: true,
    },
  });
}

export async function createAlumniFromStudent(
  studentId: string,
  instituteId: string,
  overrides?: Partial<{
    completionType: AlumniCompletionType;
    completedAt: string;
    occupation: string;
    currentStudy: string;
    achievements: string;
    testimonial: string;
    isFeatured: boolean;
    isPublic: boolean;
  }>
) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, instituteId },
    include: {
      teacher: { include: { user: { select: { name: true } } } },
      hifzParaCompletions: { select: { daysToComplete: true } },
      alumni: true,
    },
  });
  if (!student) throw new Error("Student not found");
  if (student.alumni) return student.alumni;

  const completedAt = overrides?.completedAt
    ? new Date(overrides.completedAt)
    : student.hifzCompletedAt ?? new Date();

  let completionType = overrides?.completionType ?? AlumniCompletionType.HIFZ_FULL;
  if (!overrides?.completionType) {
    if (student.hifzCompletedAt) completionType = AlumniCompletionType.HIFZ_FULL;
    else if (student.programType === ProgramType.NAZRA) completionType = AlumniCompletionType.NAZRA_COMPLETE;
    else if (student.programType === ProgramType.TAJWEED) completionType = AlumniCompletionType.TAJWEED_CERTIFIED;
    else completionType = AlumniCompletionType.OTHER;
  }

  const totalDays = student.hifzParaCompletions.reduce((sum, p) => sum + p.daysToComplete, 0);

  return prisma.instituteAlumni.create({
    data: {
      instituteId,
      studentId,
      fullName: student.fullName,
      photo: student.photo,
      gender: student.gender,
      programType: student.programType,
      completionType,
      completedAt,
      batchYear: String(completedAt.getUTCFullYear()),
      studentIdLabel: student.studentId,
      teacherName: student.teacher?.user?.name ?? null,
      totalDaysHifz: totalDays > 0 ? totalDays : null,
      city: student.city,
      occupation: overrides?.occupation ?? null,
      currentStudy: overrides?.currentStudy ?? null,
      achievements: overrides?.achievements ?? null,
      testimonial: overrides?.testimonial ?? null,
      isFeatured: overrides?.isFeatured ?? false,
      isPublic: overrides?.isPublic ?? true,
    },
  });
}
