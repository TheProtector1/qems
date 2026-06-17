import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StudentsContent } from "@/components/institute/students-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
<<<<<<< HEAD
import { Suspense } from "react";
=======
>>>>>>> 69c1b278484f624f04044e45de8438706888ccac

export const metadata = { title: "Students" };

export default async function StudentsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  return (
    <DashboardShell
      title="Students"
      breadcrumbs={[{ label: "Institute" }, { label: "Students" }]}
    >
<<<<<<< HEAD
      <Suspense fallback={<div className="py-20 text-center text-gray-500">Loading students...</div>}>
        <StudentsContent />
      </Suspense>
=======
      <StudentsContent />
>>>>>>> 69c1b278484f624f04044e45de8438706888ccac
    </DashboardShell>
  );
}
