import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProgramType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.feeStructure.findFirst({
      where: { id: params.id, instituteId: session.user.instituteId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const updated = await prisma.feeStructure.update({
      where: { id: params.id },
      data: {
        ...(body.name != null ? { name: String(body.name).trim() } : {}),
        ...(body.programType !== undefined
          ? { programType: body.programType ? (body.programType as ProgramType) : null }
          : {}),
        ...(body.amount != null ? { amount: Number(body.amount) } : {}),
        ...(body.frequency != null ? { frequency: body.frequency } : {}),
        ...(body.description !== undefined ? { description: body.description || null } : {}),
        ...(body.isActive != null ? { isActive: Boolean(body.isActive) } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      structure: { ...updated, amount: Number(updated.amount) },
    });
  } catch (error) {
    console.error("[FEE_STRUCTURE_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.feeStructure.findFirst({
      where: { id: params.id, instituteId: session.user.instituteId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.feeStructure.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FEE_STRUCTURE_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
