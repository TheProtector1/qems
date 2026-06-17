import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || !session.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teachers = await prisma.teacher.findMany({
      where: { instituteId: session.user.instituteId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ teachers });
  } catch (error) {
    console.error("Get teachers error:", error);
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
    const { name, email, password, qualification, specialization, experience, salary } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const count = await prisma.teacher.count({
      where: { instituteId: session.user.instituteId },
    });
    const teacherCode = `TCH-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          role: "TEACHER",
          isActive: true,
          instituteId: session.user.instituteId,
        },
      });

      const teacher = await tx.teacher.create({
        data: {
          teacherCode,
          qualification: qualification || null,
          specialization: specialization || null,
          experience: experience ? parseInt(experience) : null,
          salary: salary ? parseFloat(salary) : null,
          joinDate: new Date(),
          userId: user.id,
          instituteId: session.user.instituteId,
        },
      });

      return { user, teacher };
    });

    return NextResponse.json({ success: true, teacher: result.teacher });
  } catch (error: any) {
    console.error("Create teacher error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
