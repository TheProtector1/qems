import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const lowerEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: lowerEmail },
    });

    if (!user) {
      return NextResponse.json({ error: "No account found with this email address." }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "This email address is already verified." }, { status: 400 });
    }

    // Clean up any old verification tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { identifier: lowerEmail },
    });

    // Create a new verification token
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        identifier: lowerEmail,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Send the email
    const emailSent = await sendVerificationEmail(lowerEmail, token);
    if (!emailSent) {
      return NextResponse.json({ error: "Failed to send verification email. Please check SMTP configuration." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Verification email sent successfully. Please check your inbox." });
  } catch (error: any) {
    console.error("Resend verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
