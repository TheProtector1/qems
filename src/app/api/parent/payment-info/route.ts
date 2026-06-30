import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: {
        students: {
          take: 1,
          include: {
            institute: {
              select: { name: true, phone: true, email: true, address: true, city: true },
            },
          },
        },
      },
    });

    const institute = parent?.students[0]?.institute;
    if (!institute) {
      return NextResponse.json({ paymentInfo: null });
    }

    return NextResponse.json({
      paymentInfo: {
        instituteName: institute.name,
        phone: institute.phone,
        email: institute.email,
        address: [institute.address, institute.city].filter(Boolean).join(", "),
        methods: [
          { id: "JAZZCASH", label: "JazzCash", instructions: `Send fee to institute JazzCash account and share screenshot with ${institute.phone || "the office"}.` },
          { id: "EASYPAISA", label: "EasyPaisa", instructions: `Transfer via EasyPaisa to ${institute.phone || "institute number"} with student ID in reference.` },
          { id: "BANK", label: "Bank Transfer", instructions: "Contact the institute office for bank account details." },
          { id: "CASH", label: "Cash at Office", instructions: institute.address ? `Pay in person at ${institute.address}` : "Pay in person at the institute office." },
        ],
      },
    });
  } catch (error) {
    console.error("[PARENT_PAYMENT_INFO_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
