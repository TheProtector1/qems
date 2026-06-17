import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StudentsContent } from "@/components/institute/students-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "My Students — Teacher Portal" };

export default async function TeacherStudentsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="My Students"
      breadcrumbs={[{ label: "Teacher" }, { label: "Students" }]}
    >
      <StudentsContent role="teacher" addHref="/institute/students/new" />
    </DashboardShell>
  );
}
