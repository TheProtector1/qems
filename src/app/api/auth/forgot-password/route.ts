import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // If user doesn't exist, we still return success to prevent enumeration
    if (user) {
      // Delete any existing tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: { email: user.email },
      });

      const token = crypto.randomBytes(32).toString("hex");

      await prisma.passwordResetToken.create({
        data: {
          email: user.email,
          token,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
        },
      });

      // Send the email asynchronously
      sendPasswordResetEmail(user.email, token).catch(console.error);
    }

    return NextResponse.json({ success: true, message: "If an account with that email exists, we sent a reset link." });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
