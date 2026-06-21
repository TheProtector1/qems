import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { instituteName, ownerName, email, phone, password } = await req.json();

    if (!instituteName || !ownerName || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    // Generate a unique slug
    let slug = instituteName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const existingInst = await prisma.institute.findUnique({ where: { slug } });
    if (existingInst) {
      slug += "-" + crypto.randomBytes(2).toString("hex");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const institute = await tx.institute.create({
        data: {
          name: instituteName,
          slug,
          email: email.toLowerCase(),
          phone,
          isApproved: false, // Must be approved by super admin
        },
      });

      const user = await tx.user.create({
        data: {
          name: ownerName,
          email: email.toLowerCase(),
          password: hashedPassword,
          role: "INSTITUTE_OWNER",
          instituteId: institute.id,
          mustChangePassword: false,
        },
      });

      const token = crypto.randomBytes(32).toString("hex");
      await tx.verificationToken.create({
        data: {
          identifier: email.toLowerCase(),
          token,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      return { user, institute, token };
    });

    // Send verification email asynchronously
    sendVerificationEmail(result.user.email, result.token).catch(console.error);

    return NextResponse.json({ success: true, message: "Registration successful. Please verify your email." });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
