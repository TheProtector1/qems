import { DashboardShell } from "@/components/layout/dashboard-shell";
import { InstituteAboutContent } from "@/components/institute/institute-about-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serializeInstituteProfile } from "@/lib/institute-profile";

export const metadata = { title: "About Our Institute - QEMS" };

export default async function InstituteAboutPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  const instituteId = session.user.instituteId;
  if (!instituteId) redirect("/dashboard");

  const institute = await prisma.institute.findUnique({ where: { id: instituteId } });
  const initialProfile = institute ? serializeInstituteProfile(institute) : null;

  const canEdit =
    session.user.role === "INSTITUTE_OWNER" || session.user.role === "SUPER_ADMIN";

  return (
    <DashboardShell
      title="About Our Institute"
      breadcrumbs={[{ label: "Institute" }, { label: "About" }]}
    >
      <InstituteAboutContent canEdit={canEdit} initialProfile={initialProfile} />
    </DashboardShell>
  );
}
