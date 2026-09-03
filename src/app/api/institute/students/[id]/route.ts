import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Gender, HifzDirection, ProgramType, ProgressStartType, StudentEnrollmentStatus } from "@prisma/client";
import { createAuditLog, diffFields } from "@/lib/audit";
import { resolveInstituteClassIds, syncStudentClassEnrollments } from "@/lib/student-enrollments";
import { parseHifzDirection } from "@/lib/hifz-progress";
import { isActiveForStatus, STUDENT_STATUS_OPTIONS } from "@/lib/student-status";

const VALID_STATUSES = new Set(STUDENT_STATUS_OPTIONS.map((o) => o.value));

const TRACKED_FIELDS = [
  "fullName",
  "gender",
  "dateOfBirth",
  "address",
  "city",
  "programType",
  "teacherId",
  "currentJuz",
  "currentPara",
  "hifzDirection",
  "progressStartType",
  "previousInstitute",
  "isActive",
  "status",
  "statusReason",
  "photo",
] as const;

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const {
      fullName,
      gender,
      dateOfBirth,
      address,
      city,
      fatherName,
      parentPhone,
      parentEmail,
      program,
      teacherId,
      currentJuz,
      currentPara,
      hifzDirection,
      progressStartType,
      previousInstitute,
      isActive,
      status,
      statusReason,
      photo,
      classIds,
    } = body;

    if (status !== undefined) {
      if (!VALID_STATUSES.has(status)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
      const managerRoles = ["SUPER_ADMIN", "INSTITUTE_OWNER", "BRANCH_MANAGER"];
      if (!managerRoles.includes(session.user.role)) {
        return NextResponse.json(
          { error: "Only institute owners, branch managers, or admins can change enrollment status" },
          { status: 403 }
        );
      }
    }

    const student = await prisma.student.findFirst({
      where: { id, instituteId: session.user.instituteId },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const beforeSnapshot = {
      fullName: student.fullName,
      gender: student.gender,
      dateOfBirth: student.dateOfBirth,
      address: student.address,
      city: student.city,
      programType: student.programType,
      teacherId: student.teacherId,
      currentJuz: student.currentJuz,
      currentPara: student.currentPara,
      hifzDirection: student.hifzDirection,
      progressStartType: student.progressStartType,
      previousInstitute: student.previousInstitute,
      isActive: student.isActive,
      status: student.status,
      statusReason: student.statusReason,
      photo: student.photo,
    };

    const result = await prisma.$transaction(async (tx) => {
      const studentData: Record<string, unknown> = {};
      if (fullName) studentData.fullName = fullName;
      if (gender) studentData.gender = gender as Gender;
      if (dateOfBirth) studentData.dateOfBirth = new Date(dateOfBirth);
      if (address !== undefined) studentData.address = address;
      if (city !== undefined) studentData.city = city;
      if (teacherId !== undefined) studentData.teacherId = teacherId || null;
      if (currentJuz !== undefined) studentData.currentJuz = currentJuz ? parseInt(currentJuz) : null;
      if (currentPara !== undefined) studentData.currentPara = currentPara ? parseInt(currentPara) : null;
      if (hifzDirection !== undefined) {
        studentData.hifzDirection = hifzDirection ? parseHifzDirection(hifzDirection) : null;
      }
      if (progressStartType !== undefined) {
        studentData.progressStartType =
          progressStartType === "CONTINUING" ? ProgressStartType.CONTINUING : ProgressStartType.NEW;
      }
      if (previousInstitute !== undefined) studentData.previousInstitute = previousInstitute || null;
      if (typeof isActive === "boolean") studentData.isActive = isActive;
      if (status !== undefined) {
        const nextStatus = status as StudentEnrollmentStatus;
        studentData.status = nextStatus;
        studentData.statusReason = nextStatus === "ACTIVE" ? null : statusReason?.trim() || null;
        studentData.statusUpdatedAt = new Date();
        // Keep the legacy isActive flag in sync so existing active-student queries
        // (attendance rosters, class lists, dashboards) still work correctly.
        studentData.isActive = isActiveForStatus(nextStatus);
      }
      if (photo !== undefined) studentData.photo = photo || null;

      if (program) {
        let programType: ProgramType = ProgramType.HIFZ;
        if (program.toUpperCase() === "NAZRA") programType = ProgramType.NAZRA;
        if (program.toUpperCase() === "TAJWEED") programType = ProgramType.TAJWEED;
        studentData.programType = programType;
      }

      const updatedStudent = await tx.student.update({
        where: { id },
        data: studentData,
      });

      if (fullName && student.userId) {
        await tx.user.update({
          where: { id: student.userId },
          data: { name: fullName },
        });
      }

      if (photo && student.userId) {
        await tx.user.update({
          where: { id: student.userId },
          data: { image: photo },
        });
      }

      if (student.parentId && (fatherName || parentEmail)) {
        const parent = await tx.parent.findUnique({
          where: { id: student.parentId },
        });
        if (parent) {
          const parentUserData: Record<string, string> = {};
          if (fatherName) parentUserData.name = fatherName;
          if (parentEmail) parentUserData.email = parentEmail.toLowerCase();
          await tx.user.update({
            where: { id: parent.userId },
            data: parentUserData,
          });
        }
      }

      if (classIds !== undefined) {
        const validClassIds = await resolveInstituteClassIds(
          tx,
          session.user.instituteId,
          classIds
        );
        await syncStudentClassEnrollments(tx, id, validClassIds);
      }

      return updatedStudent;
    });

    const afterSnapshot = {
      fullName: result.fullName,
      gender: result.gender,
      dateOfBirth: result.dateOfBirth,
      address: result.address,
      city: result.city,
      programType: result.programType,
      teacherId: result.teacherId,
      currentJuz: result.currentJuz,
      currentPara: result.currentPara,
      hifzDirection: result.hifzDirection,
      progressStartType: result.progressStartType,
      previousInstitute: result.previousInstitute,
      isActive: result.isActive,
      status: result.status,
      statusReason: result.statusReason,
      photo: result.photo,
    };

    const changes = diffFields(beforeSnapshot, afterSnapshot, [...TRACKED_FIELDS]);
    if (changes.length > 0) {
      await createAuditLog({
        entityType: "STUDENT",
        entityId: result.id,
        entityLabel: result.fullName,
        action: "UPDATE",
        details: { changes },
        performedById: session.user.id,
        performerRole: session.user.role,
        instituteId: session.user.instituteId,
      });
    }

    return NextResponse.json({ success: true, student: result });
  } catch (error: unknown) {
    console.error("Update student error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const student = await prisma.student.findFirst({
      where: { id, instituteId: session.user.instituteId },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    await createAuditLog({
      entityType: "STUDENT",
      entityId: student.id,
      entityLabel: student.fullName,
      action: "DELETE",
      details: {
        summary: `Student ${student.studentId} removed`,
        studentId: student.studentId,
      },
      performedById: session.user.id,
      performerRole: session.user.role,
      instituteId: session.user.instituteId,
    });

    if (student.userId) {
      await prisma.user.delete({
        where: { id: student.userId },
      });
    } else {
      await prisma.student.delete({
        where: { id },
      });
    }

    return NextResponse.json({ success: true, message: "Student deleted successfully" });
  } catch (error: unknown) {
    console.error("Delete student error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
