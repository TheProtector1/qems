import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    if (verificationToken.expires < new Date()) {
      return NextResponse.json({ error: "Token expired" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({
        where: { token },
      }),
    ]);

    // Redirect to a success page or just return JSON and let the frontend handle
    // Since this is an API route, if they click from email, they are navigating here via browser.
    // Wait, the email sent them to /auth/verify-email?token=...
    // So this API will be called by that page!
    return NextResponse.json({ success: true, message: "Email verified successfully" });
  } catch (error: any) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
