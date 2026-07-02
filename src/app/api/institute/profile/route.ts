import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeInstituteProfile } from "@/lib/institute-profile";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const institute = await prisma.institute.findUnique({
      where: { id: session.user.instituteId },
    });

    if (!institute) {
      return NextResponse.json({ error: "Institute not found" }, { status: 404 });
    }

    return NextResponse.json({ profile: serializeInstituteProfile(institute) });
  } catch (error) {
    console.error("[INSTITUTE_PROFILE_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "INSTITUTE_OWNER" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only institute owners can update the profile" }, { status: 403 });
    }

    const body = await req.json();
    const {
      description,
      tagline,
      vision,
      mission,
      goals,
      values,
      achievements,
      foundedYear,
      logo,
      coverImage,
      website,
      address,
      city,
      directorName,
    } = body;

    const institute = await prisma.institute.update({
      where: { id: session.user.instituteId },
      data: {
        ...(description !== undefined ? { description: description || null } : {}),
        ...(tagline !== undefined ? { tagline: tagline || null } : {}),
        ...(vision !== undefined ? { vision: vision || null } : {}),
        ...(mission !== undefined ? { mission: mission || null } : {}),
        ...(goals !== undefined ? { goals } : {}),
        ...(values !== undefined ? { values } : {}),
        ...(achievements !== undefined ? { achievements } : {}),
        ...(foundedYear !== undefined
          ? { foundedYear: foundedYear ? Number(foundedYear) : null }
          : {}),
        ...(logo !== undefined ? { logo: logo || null } : {}),
        ...(coverImage !== undefined ? { coverImage: coverImage || null } : {}),
        ...(website !== undefined ? { website: website || null } : {}),
        ...(address !== undefined ? { address: address || null } : {}),
        ...(city !== undefined ? { city: city || null } : {}),
        ...(directorName !== undefined ? { directorName: directorName || null } : {}),
      },
    });

    return NextResponse.json({ profile: serializeInstituteProfile(institute) });
  } catch (error) {
    console.error("[INSTITUTE_PROFILE_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
