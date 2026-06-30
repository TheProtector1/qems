import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createNotification, notifyParentOfStudent } from "@/lib/notifications";

type BadgeCriteria = {
  type?: string;
  juz?: number;
  paras?: number;
  threshold?: number;
};

export async function tryAwardBadgesForStudent(
  studentId: string,
  context: { completedParas: number; hifzCompleted: boolean; currentJuz: number | null }
) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { instituteId: true, fullName: true },
  });
  if (!student) return;

  const badges = await prisma.badge.findMany({
    where: {
      isActive: true,
      OR: [{ instituteId: student.instituteId }, { instituteId: null }],
    },
  });

  const existing = await prisma.studentBadge.findMany({
    where: { studentId },
    select: { badgeId: true },
  });
  const earned = new Set(existing.map((e) => e.badgeId));

  for (const badge of badges) {
    if (earned.has(badge.id)) continue;
    const criteria = badge.criteria as BadgeCriteria;
    let eligible = false;

    if (criteria.type === "juz-completed" && criteria.juz != null) {
      eligible = context.completedParas >= criteria.juz;
    } else if (criteria.type === "para-count" || criteria.type === "paras") {
      const threshold = criteria.threshold ?? criteria.paras ?? 1;
      eligible = context.completedParas >= threshold;
    } else if (criteria.type === "hifz-complete") {
      eligible = context.hifzCompleted;
    } else if (criteria.type === "juz-completed" && !criteria.juz) {
      eligible = context.completedParas >= 1;
    }

    if (!eligible) continue;

    await prisma.studentBadge.create({
      data: { studentId, badgeId: badge.id },
    });

    const studentUser = await prisma.student.findUnique({
      where: { id: studentId },
      select: { userId: true },
    });

    if (studentUser?.userId) {
      await createNotification({
        userId: studentUser.userId,
        instituteId: student.instituteId,
        type: NotificationType.ACHIEVEMENT,
        title: "New badge earned!",
        message: `You earned the "${badge.name}" badge. MashaAllah!`,
        data: { badgeId: badge.id, studentId },
      });
    }

    await notifyParentOfStudent(studentId, {
      type: NotificationType.ACHIEVEMENT,
      title: "Badge earned",
      message: `${student.fullName} earned the "${badge.name}" badge.`,
      data: { badgeId: badge.id, studentId },
    });
  }
}
