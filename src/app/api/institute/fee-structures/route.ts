import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProgramType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const structures = await prisma.feeStructure.findMany({
      where: { instituteId: session.user.instituteId },
      orderBy: [{ isActive: "desc" }, { programType: "asc" }],
    });

    return NextResponse.json({
      structures: structures.map((s) => ({
        id: s.id,
        name: s.name,
        programType: s.programType,
        amount: Number(s.amount),
        currency: s.currency,
        frequency: s.frequency,
        isActive: s.isActive,
        description: s.description,
      })),
    });
  } catch (error) {
    console.error("[FEE_STRUCTURES_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["INSTITUTE_OWNER", "SUPER_ADMIN", "BRANCH_MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, programType, amount, frequency, description } = body;

    if (!name?.trim() || amount == null) {
      return NextResponse.json({ error: "Name and amount are required" }, { status: 400 });
    }

    const structure = await prisma.feeStructure.create({
      data: {
        name: name.trim(),
        programType: programType ? (programType as ProgramType) : null,
        amount: Number(amount),
        frequency: frequency || "MONTHLY",
        description: description?.trim() || null,
        instituteId: session.user.instituteId,
      },
    });

    return NextResponse.json({
      success: true,
      structure: { ...structure, amount: Number(structure.amount) },
    });
  } catch (error) {
    console.error("[FEE_STRUCTURES_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
