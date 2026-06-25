import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProgramType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instituteId = session.user.instituteId;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    const [students, rules, records] = await Promise.all([
      prisma.student.findMany({
        where: { instituteId, isActive: true, programType: ProgramType.TAJWEED },
        select: { id: true, fullName: true, currentSurah: true },
        orderBy: { fullName: "asc" },
      }),
      prisma.tajweedRule.findMany({ orderBy: [{ category: "asc" }, { order: "asc" }] }),
      prisma.tajweedRecord.findMany({
        where: {
          student: { instituteId },
          ...(studentId ? { studentId } : {}),
        },
        include: { rule: true },
      }),
    ]);

    const studentSummaries = students.map((s) => {
      const studentRecords = records.filter((r) => r.studentId === s.id);
      const mastered = studentRecords.filter((r) => r.isMastered).length;
      const total = rules.length || 1;

      return {
        id: s.id,
        name: s.fullName,
        progress: s.currentSurah || "Starting",
        masteredCount: mastered,
        totalRules: rules.length,
        masteryPct: Math.round((mastered / total) * 100),
      };
    });

    const evaluations = records.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      ruleId: r.ruleId,
      ruleName: r.rule.ruleName,
      category: r.rule.category,
      isMastered: r.isMastered,
      practiceScore: r.practiceScore,
      notes: r.notes,
      masteredAt: r.masteredAt?.toISOString().slice(0, 10) ?? null,
    }));

    return NextResponse.json({
      students: studentSummaries,
      rules: rules.map((r) => ({
        id: r.id,
        category: r.category,
        ruleName: r.ruleName,
        arabicName: r.arabicName,
        description: r.description,
        order: r.order,
      })),
      evaluations,
    });
  } catch (error) {
    console.error("Get tajweed error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instituteId = session.user.instituteId;
    const body = await req.json();
    const { studentId, ruleId, isMastered, practiceScore, notes } = body;

    if (!studentId || !ruleId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, instituteId, programType: ProgramType.TAJWEED },
    });

    if (!student) {
      return NextResponse.json({ error: "Tajweed student not found" }, { status: 404 });
    }

    const record = await prisma.tajweedRecord.upsert({
      where: { studentId_ruleId: { studentId, ruleId } },
      create: {
        studentId,
        ruleId,
        isMastered: Boolean(isMastered),
        masteredAt: isMastered ? new Date() : null,
        practiceScore: practiceScore ? parseInt(String(practiceScore), 10) : null,
        notes: notes || null,
        assessedBy: session.user.name || session.user.id,
      },
      update: {
        isMastered: Boolean(isMastered),
        masteredAt: isMastered ? new Date() : null,
        practiceScore: practiceScore ? parseInt(String(practiceScore), 10) : null,
        notes: notes || null,
        assessedBy: session.user.name || session.user.id,
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("Upsert tajweed record error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
