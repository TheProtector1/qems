import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Users, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "My Classes - Teacher Portal" };

export default async function TeacherClassesPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  const teacher = session.user.instituteId
    ? await prisma.teacher.findFirst({
        where: { userId: session.user.id, instituteId: session.user.instituteId },
      })
    : null;

  const classes = teacher
    ? await prisma.class.findMany({
        where: { teacherId: teacher.id },
        include: { _count: { select: { enrollments: true } } },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <DashboardShell
      title="My Classes"
      breadcrumbs={[{ label: "Teacher Portal" }, { label: "My Classes" }]}
    >
      <div className="space-y-6">
        <div>
          <h2 className="section-heading font-display text-2xl font-bold text-gray-900">Assigned Classes</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage details and lesson plans for your courses</p>
        </div>

        {classes.length === 0 ? (
          <div className="dash-card p-12 text-center text-gray-400">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No classes assigned yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {classes.map((c) => (
              <div key={c.id} className="dash-card p-6 flex flex-col justify-between">
                <div>
                  <span className="pill pill-primary text-[10px] py-0.5 px-2 mb-3 inline-block">
                    {c.programType}
                  </span>
                  <h3 className="font-display text-xl font-bold text-gray-900 mb-1">{c.name}</h3>
                  <p className="text-xs text-gray-400 mb-4">{c.code}</p>

                  <div className="space-y-2.5 text-sm text-gray-600 mb-6">
                    {c.meetingLink && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>Online class</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{c._count.enrollments} Students Enrolled</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href="/teacher/attendance" className="btn-ghost flex-1 text-center justify-center text-xs py-2">
                    Attendance
                  </Link>
                  <Link href="/teacher/quran/hifz" className="btn-primary flex-1 text-center justify-center text-xs py-2">
                    Progress <ArrowRight className="h-3 w-3 inline ml-0.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
