import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2, Users, Clock, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = { title: "Classes — QEMS" };

const CLASSES = [
  { id: "c1", name: "Hifz A", program: "Hifz", teacher: "Qari Hamid", students: 12, time: "08:00–12:00", room: "Room 101" },
  { id: "c2", name: "Hifz B", program: "Hifz", teacher: "Ustaza Rukhsar", students: 10, time: "08:00–12:00", room: "Room 102" },
  { id: "c3", name: "Hifz C", program: "Hifz", teacher: "Qari Imran", students: 9, time: "08:00–12:00", room: "Room 103" },
  { id: "c4", name: "Nazra 1", program: "Nazra", teacher: "Qari Bilal", students: 15, time: "02:00–04:00", room: "Room 201" },
  { id: "c5", name: "Nazra 2", program: "Nazra", teacher: "Ustaza Rukhsar", students: 8, time: "02:00–04:00", room: "Room 202" },
  { id: "c6", name: "Tajweed Advanced", program: "Tajweed", teacher: "Qari Hamid", students: 6, time: "04:30–06:00", room: "Lab A" },
];

export default async function ClassesPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Classes & Sections"
      breadcrumbs={[{ label: "Students", href: "/institute/students" }, { label: "Classes" }]}
    >
      <div className="space-y-6">
        <div>
          <h2 className="section-heading">Class Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">View and manage all class sections across programs</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CLASSES.map((c) => (
            <div key={c.id} className="dash-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-display text-lg font-bold text-gray-900">{c.name}</h3>
                  <span className="pill pill-primary text-[10px] py-0.5 mt-1 inline-block">{c.program}</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary-600" />
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600 mt-4">
                <div className="flex items-center gap-2"><BookOpen className="h-3.5 w-3.5 text-gray-400" /> Teacher: <strong>{c.teacher}</strong></div>
                <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-gray-400" /> {c.students} students enrolled</div>
                <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-gray-400" /> {c.time} • {c.room}</div>
              </div>
              <div className="mt-5 pt-4 border-t border-gray-100 flex gap-2">
                <Link href="/institute/settings" className="btn-ghost flex-1 text-xs py-1.5 text-center">Edit</Link>
                <Link href={`/institute/students?program=${c.program}`} className="btn-primary flex-1 text-xs py-1.5 text-center">View Students</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
