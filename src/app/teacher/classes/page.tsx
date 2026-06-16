import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Users, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "My Classes - Teacher Portal" };

const CLASSES = [
  { id: "c1", name: "Hifz A", program: "Hifz", studentsCount: 12, time: "08:00 AM - 12:00 PM", room: "Room 101" },
  { id: "c2", name: "Nazra B", program: "Nazra", studentsCount: 8, time: "02:00 PM - 04:00 PM", room: "Room 102" },
  { id: "c3", name: "Tajweed Intermediate", program: "Tajweed", studentsCount: 6, time: "04:30 PM - 06:00 PM", room: "Lab A" },
];

export default async function TeacherClassesPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

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

        <div className="grid md:grid-cols-3 gap-6">
          {CLASSES.map((c) => (
            <div key={c.id} className="dash-card p-6 flex flex-col justify-between">
              <div>
                <span className="pill pill-primary text-[10px] py-0.5 px-2 mb-3 inline-block">
                  {c.program}
                </span>
                <h3 className="font-display text-xl font-bold text-gray-900 mb-1">{c.name}</h3>
                <p className="text-xs text-gray-400 mb-4">{c.room}</p>
                
                <div className="space-y-2.5 text-sm text-gray-600 mb-6">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{c.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{c.studentsCount} Students Enrolled</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href="/teacher/attendance"
                  className="btn-ghost flex-1 text-center justify-center text-xs py-2"
                >
                  Attendance
                </Link>
                <Link
                  href="/teacher/quran/hifz"
                  className="btn-primary flex-1 text-center justify-center text-xs py-2"
                >
                  Progress
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
