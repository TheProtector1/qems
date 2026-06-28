import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createStudentDocuments,
  documentSelect,
  serializeDocument,
  validateDocumentInput,
} from "@/lib/student-documents-server";

export const dynamic = "force-dynamic";

async function getStudentForInstitute(studentId: string, instituteId: string) {
  return prisma.student.findFirst({
    where: { id: studentId, instituteId },
    select: { id: true, fullName: true },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await getStudentForInstitute(params.id, session.user.instituteId);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const documents = await prisma.studentDocument.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
      select: documentSelect,
    });

    return NextResponse.json({
      documents: documents.map(serializeDocument),
    });
  } catch (error) {
    console.error("[STUDENT_DOCUMENTS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await getStudentForInstitute(params.id, session.user.instituteId);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const body = await req.json();
    const items = Array.isArray(body.documents) ? body.documents : [body];

    for (const item of items) {
      const err = validateDocumentInput(item);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
    }

    const created = await createStudentDocuments(
      prisma,
      student.id,
      items,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      documents: created.map(serializeDocument),
    });
  } catch (error: unknown) {
    console.error("[STUDENT_DOCUMENTS_POST]", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
