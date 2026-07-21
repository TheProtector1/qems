import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { AttendanceMethod, AttendanceStatus } from "@prisma/client";
import { parseDateOnly, todayDateKey } from "@/lib/timezone";

export function generateQrToken() {
  return `qems_${randomBytes(16).toString("hex")}`;
}

export async function ensureStudentQrToken(studentId: string) {
  const existing = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, qrToken: true, instituteId: true, fullName: true, studentId: true },
  });
  if (!existing) return null;
  if (existing.qrToken) return existing;

  const qrToken = generateQrToken();
  return prisma.student.update({
    where: { id: studentId },
    data: { qrToken, qrTokenCreatedAt: new Date() },
    select: { id: true, qrToken: true, instituteId: true, fullName: true, studentId: true },
  });
}

export async function checkInByQrToken(opts: {
  token: string;
  instituteId: string;
  markedById?: string | null;
  dateKey?: string;
}) {
  const student = await prisma.student.findFirst({
    where: {
      qrToken: opts.token,
      instituteId: opts.instituteId,
      isActive: true,
    },
    select: { id: true, fullName: true, studentId: true },
  });
  if (!student) return { ok: false as const, error: "Invalid or unknown QR code" };

  const date = parseDateOnly(opts.dateKey || todayDateKey());
  const existing = await prisma.attendance.findFirst({
    where: { studentId: student.id, date, classId: null },
  });

  const now = new Date();
  if (existing) {
    if (existing.status === AttendanceStatus.PRESENT || existing.status === AttendanceStatus.LATE) {
      return {
        ok: true as const,
        alreadyMarked: true,
        student,
        status: existing.status,
        checkInTime: existing.checkInTime,
      };
    }
    const updated = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        status: AttendanceStatus.PRESENT,
        method: AttendanceMethod.QR_CODE,
        checkInTime: now,
        markedById: opts.markedById ?? existing.markedById,
      },
    });
    return {
      ok: true as const,
      alreadyMarked: false,
      student,
      status: updated.status,
      checkInTime: updated.checkInTime,
    };
  }

  const created = await prisma.attendance.create({
    data: {
      studentId: student.id,
      date,
      status: AttendanceStatus.PRESENT,
      method: AttendanceMethod.QR_CODE,
      checkInTime: now,
      markedById: opts.markedById ?? null,
      classId: null,
    },
  });

  return {
    ok: true as const,
    alreadyMarked: false,
    student,
    status: created.status,
    checkInTime: created.checkInTime,
  };
}
