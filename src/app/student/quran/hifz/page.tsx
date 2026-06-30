import { DashboardShell } from "@/components/layout/dashboard-shell";
import { HifzContent } from "@/components/institute/hifz-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "My Hifz Map - Student Portal" };

export default async function StudentHifzPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="My Hifz Progress Map"
      breadcrumbs={[{ label: "Student Portal" }, { label: "Hifz Map" }]}
    >
      <HifzContent readOnly apiBase="/api/student/hifz" />
    </DashboardShell>
  );
}
