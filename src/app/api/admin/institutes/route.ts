import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name, slug, email, phone, website, address, city, country,
      registrationNo, description, directorName, directorEmail,
      directorPhone, ownerName, ownerEmail, ownerPassword, plan,
    } = body;

    // Validate required fields
    if (!name || !slug || !email || !ownerName || !ownerEmail || !ownerPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check slug uniqueness
    const existing = await prisma.institute.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: `Slug "${slug}" is already taken. Please choose a different one.` }, { status: 400 });
    }

    // Check owner email uniqueness
    const existingUser = await prisma.user.findUnique({ where: { email: ownerEmail } });
    if (existingUser) {
      return NextResponse.json({ error: `Email "${ownerEmail}" is already registered.` }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(ownerPassword, 12);

    // Create institute + owner account in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the institute
      const institute = await tx.institute.create({
        data: {
          name,
          slug,
          email,
          phone: phone || null,
          website: website || null,
          address: address || null,
          city: city || null,
          country: country || "PK",
          registrationNo: registrationNo || null,
          description: description || null,
          directorName: directorName || null,
          directorEmail: directorEmail || null,
          directorPhone: directorPhone || null,
          isActive: true,
          isApproved: true,
          approvedAt: new Date(),
        },
      });

      // 2. Create the owner user account
      const owner = await tx.user.create({
        data: {
          name: ownerName,
          email: ownerEmail,
          password: hashedPassword,
          role: "INSTITUTE_OWNER",
          isActive: true,
          instituteId: institute.id,
        },
      });

      // 3. Create the subscription
      await tx.instituteSubscription.create({
        data: {
          instituteId: institute.id,
          plan: (plan as "STARTER" | "GROWTH" | "ENTERPRISE") || "STARTER",
          status: "TRIALING",
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 day trial
        },
      });

      return { institute, owner };
    });

    return NextResponse.json({
      success: true,
      instituteId: result.institute.id,
      message: "Institute created successfully",
    });
  } catch (error) {
    console.error("Create institute error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const institutes = await prisma.institute.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        subscription: { select: { plan: true, status: true } },
        users: { select: { name: true, role: true } },
        _count: { select: { students: true, teachers: true, users: true } },
      },
    });

    return NextResponse.json({ institutes });
  } catch (error) {
    console.error("Get institutes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
