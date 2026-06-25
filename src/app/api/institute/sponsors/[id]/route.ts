import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "INSTITUTE_OWNER" || !session.user.instituteId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const sponsor = await prisma.sponsor.update({
      where: { id: params.id, instituteId: session.user.instituteId },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
        ...(body.organization !== undefined && { organization: body.organization || null }),
        ...(body.address !== undefined && { address: body.address || null }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return NextResponse.json(sponsor);
  } catch (error) {
    console.error("[SPONSORS_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "INSTITUTE_OWNER" || !session.user.instituteId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await prisma.sponsor.delete({
      where: { id: params.id, instituteId: session.user.instituteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SPONSORS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
