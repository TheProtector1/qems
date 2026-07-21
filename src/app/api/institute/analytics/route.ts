import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getCachedInstituteAnalytics } from "@/lib/server-cache";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const branchId = new URL(req.url).searchParams.get("branchId");
    const analytics = await getCachedInstituteAnalytics(
      session.user.instituteId,
      branchId
    );
    return NextResponse.json(analytics);
  } catch (error) {
    console.error("[INSTITUTE_ANALYTICS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
