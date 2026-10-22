import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyLeaveToAttendance } from "@/lib/leave-requests";
import { notifyUser } from "@/lib/notifications";
import { LeaveRequestStatus, NotificationType, type Prisma } from "@prisma/client";
import { getTeacherScope, isStudentAssignedToTeacher } from "@/lib/teacher-scope";

export const dynamic = "force-dynamic";

const STAFF = new Set(["INSTITUTE_OWNER", "BRANCH_MANAGER", "TEACHER", "SUPER_ADMIN"]);

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId || !STAFF.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = new URL(req.url).searchParams.get("status") || "PENDING";

    const whereConditions: Prisma.LeaveRequestWhereInput[] = [
      { instituteId: session.user.instituteId },
    ];

    if (status !== "ALL") {
      whereConditions.push({ status: status as LeaveRequestStatus });
    }

    if (session.user.role === "TEACHER") {
      const teacherScope = await getTeacherScope(session.user.id, session.user.instituteId);
      if (!teacherScope.teacher) {
        return NextResponse.json({ requests: [] });
      }
      whereConditions.push({
        student: teacherScope.studentWhere,
      });
    }

    const requests = await prisma.leaveRequest.findMany({
      where: { AND: whereConditions },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            studentId: true,
            teacher: { select: { user: { select: { name: true } } } },
          },
        },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 100,
    });

    const requesterIds = Array.from(new Set(requests.map((r) => r.requestedById)));
    const requesters = await prisma.user.findMany({
      where: { id: { in: requesterIds } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(requesters.map((u) => [u.id, u.name]));

    return NextResponse.json({
      requests: requests.map((r) => ({
        id: r.id,
        studentId: r.studentId,
        studentName: r.student.fullName,
        studentCode: r.student.studentId,
        teacherName: r.student.teacher?.user?.name || null,
        parentName: nameMap.get(r.requestedById) || "Parent",
        startDate: r.startDate.toISOString().slice(0, 10),
        endDate: r.endDate.toISOString().slice(0, 10),
        reason: r.reason,
        status: r.status,
        reviewNote: r.reviewNote,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[INSTITUTE_LEAVE_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId || !session.user.id || !STAFF.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, action, reviewNote } = body as {
      id?: string;
      action?: "APPROVE" | "REJECT";
      reviewNote?: string;
    };

    if (!id || !action) {
      return NextResponse.json({ error: "id and action required" }, { status: 400 });
    }

    const existing = await prisma.leaveRequest.findFirst({
      where: { id, instituteId: session.user.instituteId },
      include: {
        student: { select: { id: true, fullName: true } },
      },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.status !== "PENDING") {
      return NextResponse.json({ error: "Request already reviewed" }, { status: 400 });
    }

    if (session.user.role === "TEACHER") {
      const teacher = await prisma.teacher.findFirst({
        where: { userId: session.user.id, instituteId: session.user.instituteId },
      });
      if (!teacher) return NextResponse.json({ error: "Unauthorized teacher profile" }, { status: 403 });
      const assigned = await isStudentAssignedToTeacher(existing.studentId, teacher.id, session.user.instituteId);
      if (!assigned) {
        return NextResponse.json({ error: "You are not assigned to this student" }, { status: 403 });
      }
    }

    const status =
      action === "APPROVE" ? LeaveRequestStatus.APPROVED : LeaveRequestStatus.REJECTED;

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        reviewNote: reviewNote?.trim() || null,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
    });

    if (status === LeaveRequestStatus.APPROVED) {
      await applyLeaveToAttendance({
        studentId: existing.studentId,
        startDate: existing.startDate,
        endDate: existing.endDate,
        reason: existing.reason,
        requestedByName: session.user.name || "Institute Staff",
        markedById: session.user.id,
      });
    }

    await notifyUser(existing.requestedById, {
      type: NotificationType.LEAVE_REQUEST,
      title: `Leave request ${status.toLowerCase()}`,
      message: `Your leave request for ${existing.student.fullName} was ${status.toLowerCase()}.${
        reviewNote ? ` Note: ${reviewNote}` : ""
      }`,
      data: { leaveRequestId: id, status },
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (error) {
    console.error("[INSTITUTE_LEAVE_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
