import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StudentDashboardContent } from "@/components/student/student-dashboard";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Student Dashboard" };

export default async function StudentDashboard() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  const userId = session.user.id;

  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      enrollments: {
        include: {
          class: true
        },
        where: { isActive: true }
      },
      hifzRecords: {
        orderBy: { date: "desc" },
        take: 3
      }
    }
  });

  return (
    <DashboardShell title="My Progress" breadcrumbs={[{ label: "Student Portal" }]}>
      <StudentDashboardContent 
        initialStudent={student ? {
          name: student.fullName,
          currentJuz: student.currentJuz,
          currentPara: student.currentPara ?? student.currentJuz,
          hifzDirection: student.hifzDirection,
          streak: 0,
          quality: 0,
          enrollments: student.enrollments
        } : null} 
      />
    </DashboardShell>
  );
}
