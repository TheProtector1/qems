import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendSmsToUser, sendWhatsAppToUser } from "@/lib/sms-reminders";

type CreateNotificationInput = {
  userId: string;
  instituteId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
};

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      instituteId: input.instituteId ?? null,
      type: input.type,
      title: input.title,
      message: input.message,
      data: input.data,
    },
  });
}

const SMS_ENABLED_TYPES: NotificationType[] = [
  NotificationType.ABSENCE,
  NotificationType.FEE_DUE,
  NotificationType.EXAM_RESULT,
  NotificationType.LEAVE_REQUEST,
];

export async function notifyParentOfStudent(
  studentId: string,
  payload: Omit<CreateNotificationInput, "userId">
) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      fullName: true,
      instituteId: true,
      parent: { select: { userId: true, user: { select: { phone: true, name: true } } } },
    },
  });
  if (!student?.parent?.userId) return null;

  const notification = await createNotification({
    userId: student.parent.userId,
    instituteId: student.instituteId,
    ...payload,
  });

  if (SMS_ENABLED_TYPES.includes(payload.type)) {
    const smsText = `${payload.title}: ${payload.message}`;
    await sendSmsToUser(student.parent.userId, smsText);
    await sendWhatsAppToUser(student.parent.userId, smsText);
  }

  return notification;
}

export async function notifyUser(
  userId: string,
  payload: Omit<CreateNotificationInput, "userId"> & { sendSms?: boolean }
) {
  const notification = await createNotification({ userId, ...payload });

  // In-app MESSAGE alerts stay silent on SMS unless explicitly requested
  if (payload.sendSms && SMS_ENABLED_TYPES.includes(payload.type)) {
    const smsText = `${payload.title}: ${payload.message}`;
    await sendSmsToUser(userId, smsText);
  }

  return notification;
}
