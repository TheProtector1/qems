import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";

const roleRedirects: Record<string, string> = {
  SUPER_ADMIN: "/admin/dashboard",
  INSTITUTE_OWNER: "/institute/dashboard",
  BRANCH_MANAGER: "/branch/dashboard",
  TEACHER: "/teacher/dashboard",
  PARENT: "/parent/dashboard",
  STUDENT: "/student/dashboard",
};

export default async function DashboardPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  const role = session.user.role as string;
  redirect(roleRedirects[role] || "/auth/login");
}
