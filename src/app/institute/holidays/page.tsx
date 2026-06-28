import { DashboardShell } from "@/components/layout/dashboard-shell";
import { HolidaysContent } from "@/components/institute/holidays-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Holidays - Institute Portal" };

export default async function InstituteHolidaysPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  if (session.user.role !== "INSTITUTE_OWNER") redirect("/institute/dashboard");

  return (
    <DashboardShell
      title="Holiday Management"
      breadcrumbs={[{ label: "Institute" }, { label: "Holidays" }]}
    >
      <HolidaysContent />
    </DashboardShell>
  );
}
