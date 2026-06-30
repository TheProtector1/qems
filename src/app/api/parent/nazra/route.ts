import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertParentOwnsStudent } from "@/lib/parent-portal-data";
import { buildNazraPayload } from "@/lib/quran-portal-data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: { students: { select: { id: true } } },
    });

    let ids = parent?.students.map((s) => s.id) ?? [];
    if (studentId) {
      if (!(await assertParentOwnsStudent(session.user.id, studentId))) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
      }
      ids = [studentId];
    }

    return NextResponse.json(await buildNazraPayload(ids));
  } catch (error) {
    console.error("[PARENT_NAZRA_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
