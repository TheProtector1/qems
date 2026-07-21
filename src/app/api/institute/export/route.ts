import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STAFF = new Set(["INSTITUTE_OWNER", "BRANCH_MANAGER", "SUPER_ADMIN"]);

/**
 * Full institute JSON backup for local archive / migration prep.
 * Omits file blobs and password hashes.
 */
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId || !STAFF.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instituteId = session.user.instituteId;

    const [
      institute,
      branches,
      students,
      teachers,
      classes,
      enrollments,
      feePayments,
      attendance,
      hifzRecords,
      leaveRequests,
      complaints,
      announcements,
      guardians,
    ] = await Promise.all([
      prisma.institute.findUnique({
        where: { id: instituteId },
        select: {
          id: true,
          name: true,
          slug: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          country: true,
          createdAt: true,
        },
      }),
      prisma.branch.findMany({
        where: { instituteId },
        select: {
          id: true,
          name: true,
          code: true,
          city: true,
          address: true,
          isActive: true,
        },
      }),
      prisma.student.findMany({
        where: { instituteId },
        select: {
          id: true,
          studentId: true,
          fullName: true,
          gender: true,
          dateOfBirth: true,
          programType: true,
          admissionDate: true,
          isActive: true,
          branchId: true,
          parentId: true,
          address: true,
          city: true,
          emergencyContact: true,
          emergencyPhone: true,
          hifzCompletedAt: true,
        },
      }),
      prisma.teacher.findMany({
        where: { instituteId },
        select: {
          id: true,
          teacherCode: true,
          isActive: true,
          branchId: true,
          user: { select: { name: true, email: true, phone: true } },
        },
      }),
      prisma.class.findMany({
        where: { instituteId },
        select: {
          id: true,
          name: true,
          code: true,
          programType: true,
          schedule: true,
          isActive: true,
          teacherId: true,
          branchId: true,
        },
      }),
      prisma.classEnrollment.findMany({
        where: { class: { instituteId } },
        select: {
          id: true,
          studentId: true,
          classId: true,
          isActive: true,
          enrolledAt: true,
        },
      }),
      prisma.feePayment.findMany({
        where: { student: { instituteId } },
        select: {
          id: true,
          invoiceNo: true,
          studentId: true,
          amount: true,
          netAmount: true,
          status: true,
          dueDate: true,
          paidAt: true,
          paymentMethod: true,
          claimStatus: true,
        },
      }),
      prisma.attendance.findMany({
        where: { student: { instituteId } },
        select: {
          id: true,
          studentId: true,
          date: true,
          status: true,
          notes: true,
        },
        orderBy: { date: "desc" },
        take: 20000,
      }),
      prisma.hifzRecord.findMany({
        where: { student: { instituteId } },
        select: {
          id: true,
          studentId: true,
          date: true,
          type: true,
          surahNumber: true,
          ayahFrom: true,
          ayahTo: true,
          rating: true,
        },
        take: 20000,
      }),
      prisma.leaveRequest.findMany({
        where: { instituteId },
        select: {
          id: true,
          studentId: true,
          startDate: true,
          endDate: true,
          reason: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.complaint.findMany({
        where: { instituteId },
        select: {
          id: true,
          caseNumber: true,
          title: true,
          category: true,
          severity: true,
          status: true,
          createdAt: true,
          resolvedAt: true,
        },
      }),
      prisma.announcement.findMany({
        where: { instituteId },
        select: {
          id: true,
          title: true,
          content: true,
          isPinned: true,
          createdAt: true,
        },
        take: 500,
      }),
      prisma.studentGuardian.findMany({
        where: { student: { instituteId } },
        select: {
          id: true,
          studentId: true,
          parentId: true,
          relation: true,
          isPrimary: true,
          canPickup: true,
        },
      }),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      version: 1,
      institute,
      branches,
      students,
      teachers,
      classes,
      enrollments,
      guardians,
      feePayments,
      attendance,
      hifzRecords,
      leaveRequests,
      complaints,
      announcements,
    };

    const slug = institute?.slug || instituteId;
    const filename = `qems-backup-${slug}-${new Date().toISOString().slice(0, 10)}.json`;

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[INSTITUTE_EXPORT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
