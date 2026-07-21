import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyLeaveToAttendance, leaveSpanDays } from "@/lib/leave-requests";
import { notifyUser } from "@/lib/notifications";
import { LeaveRequestStatus, NotificationType, Role } from "@prisma/client";
import { parseDateOnly, todayDateKey } from "@/lib/timezone";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        students: { select: { id: true } },
        guardianships: { select: { studentId: true } },
      },
    });
    const studentIds = Array.from(
      new Set([
        ...(parent?.students.map((s) => s.id) || []),
        ...(parent?.guardianships.map((g) => g.studentId) || []),
      ])
    );
    if (!studentIds.length) return NextResponse.json({ requests: [], children: [] });

    const [requests, children] = await Promise.all([
      prisma.leaveRequest.findMany({
        where: { studentId: { in: studentIds } },
        include: {
          student: { select: { id: true, fullName: true, studentId: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.student.findMany({
        where: { id: { in: studentIds }, isActive: true },
        select: { id: true, fullName: true, studentId: true },
        orderBy: { fullName: "asc" },
      }),
    ]);

    return NextResponse.json({
      children,
      requests: requests.map((r) => ({
        id: r.id,
        studentId: r.studentId,
        studentName: r.student.fullName,
        studentCode: r.student.studentId,
        startDate: r.startDate.toISOString().slice(0, 10),
        endDate: r.endDate.toISOString().slice(0, 10),
        reason: r.reason,
        status: r.status,
        reviewNote: r.reviewNote,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[PARENT_LEAVE_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { studentId, startDate, endDate, reason } = body as {
      studentId?: string;
      startDate?: string;
      endDate?: string;
      reason?: string;
    };

    if (!studentId || !startDate || !endDate || !reason?.trim()) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        isActive: true,
        OR: [
          { parent: { userId: session.user.id } },
          { guardians: { some: { parent: { userId: session.user.id } } } },
        ],
      },
      select: {
        id: true,
        fullName: true,
        instituteId: true,
        teacher: { select: { userId: true } },
      },
    });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const start = parseDateOnly(startDate);
    const end = parseDateOnly(endDate);
    if (end < start) {
      return NextResponse.json({ error: "End date must be on or after start date" }, { status: 400 });
    }
    if (leaveSpanDays(start, end) > 30) {
      return NextResponse.json({ error: "Leave cannot exceed 30 days" }, { status: 400 });
    }

    const today = parseDateOnly(todayDateKey());
    if (start < today) {
      return NextResponse.json({ error: "Start date cannot be in the past" }, { status: 400 });
    }

    const request = await prisma.leaveRequest.create({
      data: {
        studentId: student.id,
        instituteId: student.instituteId,
        requestedById: session.user.id,
        startDate: start,
        endDate: end,
        reason: reason.trim(),
        status: LeaveRequestStatus.PENDING,
      },
    });

    // Notify institute owners + assigned teacher
    const staff = await prisma.user.findMany({
      where: {
        instituteId: student.instituteId,
        isActive: true,
        OR: [
          { role: { in: [Role.INSTITUTE_OWNER, Role.BRANCH_MANAGER] } },
          ...(student.teacher?.userId ? [{ id: student.teacher.userId }] : []),
        ],
      },
      select: { id: true },
      take: 20,
    });

    void Promise.all(
      staff.map((u) =>
        notifyUser(u.id, {
          instituteId: student.instituteId,
          type: NotificationType.LEAVE_REQUEST,
          title: `Leave request — ${student.fullName}`,
          message: `${session.user.name || "Parent"} requested leave ${startDate} → ${endDate}: ${reason.trim().slice(0, 100)}`,
          data: { leaveRequestId: request.id, studentId: student.id },
        })
      )
    );

    return NextResponse.json({ success: true, id: request.id });
  } catch (error) {
    console.error("[PARENT_LEAVE_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
