import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireSuperAdmin() {
  const session = await getAuthSession();
  if (!session || session.user.role !== "SUPER_ADMIN") return null;
  return session;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await requireSuperAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const institute = await prisma.institute.findUnique({
      where: { id: params.id },
      include: {
        subscription: true,
        users: { select: { id: true, name: true, email: true, role: true, isActive: true } },
        _count: { select: { students: true, teachers: true, users: true } },
      },
    });

    if (!institute) {
      return NextResponse.json({ error: "Institute not found" }, { status: 404 });
    }

    return NextResponse.json({ institute });
  } catch (error) {
    console.error("Get institute error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await requireSuperAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name, slug, email, phone, website, address, city, country,
      registrationNo, description, directorName, directorEmail, directorPhone,
      isActive, isApproved,
    } = body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (slug !== undefined) data.slug = slug;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (website !== undefined) data.website = website;
    if (address !== undefined) data.address = address;
    if (city !== undefined) data.city = city;
    if (country !== undefined) data.country = country;
    if (registrationNo !== undefined) data.registrationNo = registrationNo;
    if (description !== undefined) data.description = description;
    if (directorName !== undefined) data.directorName = directorName;
    if (directorEmail !== undefined) data.directorEmail = directorEmail;
    if (directorPhone !== undefined) data.directorPhone = directorPhone;
    if (typeof isActive === "boolean") data.isActive = isActive;
    if (typeof isApproved === "boolean") {
      data.isApproved = isApproved;
      if (isApproved) data.approvedAt = new Date();
    }

    const institute = await prisma.institute.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ success: true, institute });
  } catch (error) {
    console.error("Update institute error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await requireSuperAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.institute.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete institute error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
