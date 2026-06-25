import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SponsorsDonationsContent } from "@/components/institute/sponsors-donations-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Sponsors & Donations — QEMS" };

export default async function SponsorsDonationsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  if (session.user.role !== "INSTITUTE_OWNER") redirect("/dashboard");

  return (
    <DashboardShell
      title="Sponsors & Donations"
      breadcrumbs={[
        { label: "Finance", href: "/institute/finance/fees" },
        { label: "Sponsors & Donations" },
      ]}
    >
      <SponsorsDonationsContent />
    </DashboardShell>
  );
}
