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
    const staff = await prisma.user.findMany({
      where: {
        instituteId: session.user.instituteId,
        role: "STAFF",
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        staffRole: true,
        phone: true,
        image: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ staff });
  } catch (error) {
    console.error("Get staff error:", error);
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
    const { name, email, password, staffRole, phone, image } = body;
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "STAFF",
        isActive: true,
        instituteId: session.user.instituteId,
        staffRole: staffRole || null,
        phone: phone || null,
        image: image || null,
        emailVerified: new Date(),
      },
    });
    return NextResponse.json({ success: true, staff: user });
  } catch (error: any) {
    console.error("Create staff error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
