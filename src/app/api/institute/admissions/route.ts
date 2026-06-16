import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProgramType, AdmissionStatus, Gender } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || !session.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const applications = await prisma.admissionApplication.findMany({
      where: { instituteId: session.user.instituteId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Get applications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      applicantName,
      gender,
      dateOfBirth,
      parentName,
      parentPhone,
      parentEmail,
      address,
      city,
      program,
      notes,
    } = body;

    if (!applicantName || !gender || !dateOfBirth || !parentName || !parentPhone || !program) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const count = await prisma.admissionApplication.count({
      where: { instituteId: session.user.instituteId },
    });
    const applicationNo = `APP-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    let programType = ProgramType.HIFZ;
    if (program.toUpperCase() === "NAZRA") programType = ProgramType.NAZRA;
    if (program.toUpperCase() === "TAJWEED") programType = ProgramType.TAJWEED;

    const application = await prisma.admissionApplication.create({
      data: {
        applicationNo,
        applicantName,
        gender: gender as Gender,
        dateOfBirth: new Date(dateOfBirth),
        parentName,
        parentPhone,
        parentEmail: parentEmail || null,
        address: address || null,
        city: city || "Islamabad",
        program: programType,
        stage: AdmissionStatus.APPLIED,
        notes: notes || null,
        instituteId: session.user.instituteId,
      },
    });

    return NextResponse.json({ success: true, application });
  } catch (error: any) {
    console.error("Create application error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
