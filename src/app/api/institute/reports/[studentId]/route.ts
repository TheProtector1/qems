import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildStudentReportPdf, ReportType } from "@/lib/pdf-reports";
import { getSurahName } from "@/lib/utils";

export const dynamic = "force-dynamic";

function parseDateOnly(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

async function authorizeStudentAccess(
  session: NonNullable<Awaited<ReturnType<typeof getAuthSession>>>,
  studentId: string
) {
  const allowedRoles = ["SUPER_ADMIN", "INSTITUTE_OWNER", "TEACHER", "BRANCH_MANAGER"];
  if (!allowedRoles.includes(session.user.role)) return null;

  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      ...(session.user.role !== "SUPER_ADMIN" && session.user.instituteId
        ? { instituteId: session.user.instituteId }
        : {}),
    },
    include: {
      institute: { select: { name: true } },
      teacher: { include: { user: { select: { name: true } } } },
      parent: { include: { user: { select: { name: true, email: true } } } },
    },
  });

  if (!student) return null;

  if (session.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findFirst({
      where: { userId: session.user.id, instituteId: student.instituteId },
    });
    if (teacher && student.teacherId && student.teacherId !== teacher.id) {
      return null;
    }
  }

  return student;
}

export async function GET(
  req: Request,
  { params }: { params: { studentId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId } = params;
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get("type") || "combined") as ReportType;
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    if (!["attendance", "hifz", "combined"].includes(type)) {
      return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }

    const student = await authorizeStudentAccess(session, studentId);
    if (!student) {
      return NextResponse.json({ error: "Student not found or access denied" }, { status: 404 });
    }

    const to = toParam ? parseDateOnly(toParam) : new Date();
    const from = fromParam
      ? parseDateOnly(fromParam)
      : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

    const attendanceRows = await prisma.attendance.findMany({
      where: { studentId, date: { gte: from, lte: to } },
      orderBy: { date: "asc" },
    });

    const present = attendanceRows.filter((r) => r.status === "PRESENT").length;
    const absent = attendanceRows.filter((r) => r.status === "ABSENT").length;
    const late = attendanceRows.filter((r) => r.status === "LATE").length;
    const leave = attendanceRows.filter((r) => r.status === "LEAVE").length;
    const marked = attendanceRows.length;
    const rate = marked ? Math.round(((present + late) / marked) * 100) : 0;

    const hifzRows = await prisma.hifzRecord.findMany({
      where: { studentId, date: { gte: from, lte: to } },
      orderBy: { date: "desc" },
    });

    const avgRating = hifzRows.length
      ? hifzRows.reduce((sum, r) => sum + r.rating, 0) / hifzRows.length
      : 0;

    const reportData = {
      instituteName: student.institute.name,
      student: {
        fullName: student.fullName,
        studentId: student.studentId,
        programType: student.programType,
        progressStartType: student.progressStartType,
        previousInstitute: student.previousInstitute,
        currentJuz: student.currentJuz,
        currentPara: student.currentPara,
        currentSurah: student.currentSurah,
        currentPage: student.currentPage,
        teacherName: student.teacher?.user?.name || "Unassigned",
        parentName: student.parent?.user?.name || "Parent",
        parentEmail: student.parent?.user?.email || null,
      },
      period: {
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
      },
      attendance: {
        rows: attendanceRows.map((r) => ({
          date: r.date.toISOString().slice(0, 10),
          status: r.status,
        })),
        present,
        absent,
        late,
        leave,
        rate,
      },
      hifz: {
        rows: hifzRows.map((r) => ({
          date: r.date.toISOString().slice(0, 10),
          type: r.type,
          surah: r.surahName || getSurahName(r.surahNumber),
          ayahs: `${r.surahNumber}:${r.ayahFrom}–${r.ayahTo}`,
          rating: r.rating,
          errors: r.errorCount,
        })),
        avgRating,
      },
      generatedBy: session.user.name || session.user.email || "Staff",
      generatedAt: new Date(),
    };

    const pdfBytes = buildStudentReportPdf(type, reportData);
    const filename = `${student.studentId}-${type}-report.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Generate report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
