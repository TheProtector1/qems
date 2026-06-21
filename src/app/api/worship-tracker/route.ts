import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let studentId = searchParams.get("studentId");
    const dateStr = searchParams.get("date");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    // If no studentId provided and current user is student, default to self
    if (!studentId && session.user.role === "STUDENT") {
      const selfStudent = await prisma.student.findUnique({
        where: { userId: session.user.id },
        select: { id: true }
      });
      if (selfStudent) {
        studentId = selfStudent.id;
      }
    }

    if (!studentId) {
      return new NextResponse("Student ID is required", { status: 400 });
    }

    // Load Student details to authorize roles
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, userId: true, instituteId: true }
    });

    if (!student) {
      return new NextResponse("Student Not Found", { status: 404 });
    }

    // Role-based authorization check
    if (session.user.role === "STUDENT") {
      if (student.userId !== session.user.id) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    } else if (session.user.role === "PARENT") {
      const parent = await prisma.parent.findUnique({
        where: { userId: session.user.id },
        include: { students: { select: { id: true } } }
      });
      const childIds = parent?.students.map((s: { id: string }) => s.id) || [];
      if (!childIds.includes(studentId)) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    } else if (session.user.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.user.id },
        include: { students: { select: { id: true } } }
      });
      const studentIds = teacher?.students.map((s: { id: string }) => s.id) || [];
      if (!studentIds.includes(studentId)) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    } else if (session.user.role === "INSTITUTE_OWNER") {
      if (student.instituteId !== session.user.instituteId) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    } else if (session.user.role !== "SUPER_ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Build search filters
    const whereClause: any = { studentId };

    if (dateStr) {
      whereClause.date = new Date(dateStr);
    } else if (startDateStr && endDateStr) {
      whereClause.date = {
        gte: new Date(startDateStr),
        lte: new Date(endDateStr)
      };
    }

    const records = await prisma.dailyWorshipRecord.findMany({
      where: whereClause,
      orderBy: { date: "asc" }
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("[WORSHIP_TRACKER_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { studentId, date, fajr, dhuhr, asr, maghrib, isha, duroodCount } = body;

    if (!studentId || !date) {
      return new NextResponse("Missing studentId or date", { status: 400 });
    }

    // Load Student details to authorize write access
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, userId: true }
    });

    if (!student) {
      return new NextResponse("Student Not Found", { status: 404 });
    }

    // Write authorization check
    if (session.user.role === "STUDENT") {
      if (student.userId !== session.user.id) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    } else if (session.user.role === "PARENT") {
      const parent = await prisma.parent.findUnique({
        where: { userId: session.user.id },
        include: { students: { select: { id: true } } }
      });
      const childIds = parent?.students.map((s: { id: string }) => s.id) || [];
      if (!childIds.includes(studentId)) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    } else {
      return new NextResponse("Only students or their parents can log spiritual progress", { status: 403 });
    }

    const recordDate = new Date(date);

    const record = await prisma.dailyWorshipRecord.upsert({
      where: {
        studentId_date: {
          studentId,
          date: recordDate
        }
      },
      update: {
        fajr: fajr !== undefined ? fajr : undefined,
        dhuhr: dhuhr !== undefined ? dhuhr : undefined,
        asr: asr !== undefined ? asr : undefined,
        maghrib: maghrib !== undefined ? maghrib : undefined,
        isha: isha !== undefined ? isha : undefined,
        duroodCount: duroodCount !== undefined ? duroodCount : undefined,
        loggedById: session.user.id
      },
      create: {
        studentId,
        date: recordDate,
        fajr: fajr || false,
        dhuhr: dhuhr || false,
        asr: asr || false,
        maghrib: maghrib || false,
        isha: isha || false,
        duroodCount: duroodCount || 0,
        loggedById: session.user.id
      }
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error("[WORSHIP_TRACKER_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
