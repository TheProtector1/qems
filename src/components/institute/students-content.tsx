"use client";

import { useState } from "react";
import {
  Search, Plus, Filter, Download, MoreHorizontal,
  ChevronLeft, ChevronRight, Eye, Edit, Trash2,
  GraduationCap, BookOpen, CalendarCheck, Star,
} from "lucide-react";
import Link from "next/link";
import { cn, formatDate, getInitials } from "@/lib/utils";

type Student = {
  id: string;
  studentId: string;
  name: string;
  gender: "MALE" | "FEMALE";
  program: string;
  class: string;
  teacher: string;
  currentJuz: number | null;
  qualityScore: number;
  attendancePct: number;
  status: string;
  admissionDate: string;
  parentName: string;
  parentPhone: string;
};

const MOCK_STUDENTS: Student[] = [
  { id: "1", studentId: "STU-2024-0001", name: "Ahmad Raza Khan", gender: "MALE", program: "Hifz", class: "Hifz A", teacher: "Qari Hamid", currentJuz: 13, qualityScore: 9.2, attendancePct: 97, status: "On Track", admissionDate: "2024-01-15", parentName: "Raza Khan", parentPhone: "0300-1234567" },
  { id: "2", studentId: "STU-2024-0002", name: "Fatima Noor Hussain", gender: "FEMALE", program: "Hifz", class: "Hifz B", teacher: "Ustaza Rukhsar", currentJuz: 8, qualityScore: 8.7, attendancePct: 94, status: "On Track", admissionDate: "2024-02-01", parentName: "Noor Hussain", parentPhone: "0321-9876543" },
  { id: "3", studentId: "STU-2024-0003", name: "Usman Ali Siddiqui", gender: "MALE", program: "Nazra", class: "Nazra 1", teacher: "Qari Bilal", currentJuz: null, qualityScore: 7.4, attendancePct: 78, status: "Needs Attention", admissionDate: "2024-01-20", parentName: "Ali Siddiqui", parentPhone: "0312-5556677" },
  { id: "4", studentId: "STU-2024-0004", name: "Zainab Hassan Malik", gender: "FEMALE", program: "Hifz", class: "Hifz A", teacher: "Ustaza Rukhsar", currentJuz: 22, qualityScore: 9.5, attendancePct: 99, status: "Excellent", admissionDate: "2023-09-01", parentName: "Hassan Malik", parentPhone: "0333-1122334" },
  { id: "5", studentId: "STU-2024-0005", name: "Ibrahim Sheikh Rahman", gender: "MALE", program: "Tajweed", class: "Tajweed Advanced", teacher: "Qari Hamid", currentJuz: null, qualityScore: 8.1, attendancePct: 91, status: "On Track", admissionDate: "2024-03-10", parentName: "Sheikh Rahman", parentPhone: "0345-6677889" },
  { id: "6", studentId: "STU-2024-0006", name: "Maryam Tariq Butt", gender: "FEMALE", program: "Hifz", class: "Hifz B", teacher: "Ustaza Rukhsar", currentJuz: 5, qualityScore: 8.3, attendancePct: 88, status: "On Track", admissionDate: "2024-04-15", parentName: "Tariq Butt", parentPhone: "0300-9988776" },
  { id: "7", studentId: "STU-2024-0007", name: "Hamza Khalid Ansari", gender: "MALE", program: "Hifz", class: "Hifz C", teacher: "Qari Imran", currentJuz: 17, qualityScore: 8.9, attendancePct: 95, status: "On Track", admissionDate: "2023-12-01", parentName: "Khalid Ansari", parentPhone: "0321-4455667" },
  { id: "8", studentId: "STU-2024-0008", name: "Sara Ijaz Chaudhry", gender: "FEMALE", program: "Nazra", class: "Nazra 2", teacher: "Ustaza Rukhsar", currentJuz: null, qualityScore: 6.9, attendancePct: 72, status: "At Risk", admissionDate: "2024-05-01", parentName: "Ijaz Chaudhry", parentPhone: "0312-7788990" },
];

const statusStyles: Record<string, string> = {
  "Excellent": "pill-success",
  "On Track": "pill-info",
  "Needs Attention": "pill-warning",
  "At Risk": "pill-danger",
};

const programColors: Record<string, string> = {
  Hifz: "bg-green-100 text-green-700",
  Nazra: "bg-blue-100 text-blue-700",
  Tajweed: "bg-violet-100 text-violet-700",
};

export function StudentsContent() {
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const perPage = 6;

  const filtered = MOCK_STUDENTS.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase()) ||
      s.parentName.toLowerCase().includes(search.toLowerCase());
    const matchProgram = programFilter === "ALL" || s.program === programFilter;
    const matchStatus = statusFilter === "ALL" || s.status === statusFilter;
    return matchSearch && matchProgram && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-heading">Students</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {MOCK_STUDENTS.length} total students enrolled
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost text-sm py-2">
            <Download className="h-4 w-4" />
            Export
          </button>
          <Link href="/institute/students/new" className="btn-primary text-sm py-2" id="btn-add-student">
            <Plus className="h-4 w-4" />
            Add Student
          </Link>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: MOCK_STUDENTS.length, icon: GraduationCap, color: "text-blue-600 bg-blue-50" },
          { label: "Hifz", value: MOCK_STUDENTS.filter(s => s.program === "Hifz").length, icon: BookOpen, color: "text-green-600 bg-green-50" },
          { label: "Nazra", value: MOCK_STUDENTS.filter(s => s.program === "Nazra").length, icon: Star, color: "text-amber-600 bg-amber-50" },
          { label: "At Risk", value: MOCK_STUDENTS.filter(s => ["Needs Attention", "At Risk"].includes(s.status)).length, icon: CalendarCheck, color: "text-red-600 bg-red-50" },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="kpi-card p-4 flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", c.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-gray-900">{c.value}</p>
                <p className="text-xs text-gray-500">{c.label} students</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Filters ── */}
      <div className="dash-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, ID, or parent..."
            className="form-input pl-10"
            id="input-search-students"
          />
        </div>
        <select
          value={programFilter}
          onChange={(e) => { setProgramFilter(e.target.value); setPage(1); }}
          className="form-input w-auto"
          id="select-program-filter"
        >
          <option value="ALL">All Programs</option>
          <option value="Hifz">Hifz</option>
          <option value="Nazra">Nazra</option>
          <option value="Tajweed">Tajweed</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="form-input w-auto"
          id="select-status-filter"
        >
          <option value="ALL">All Status</option>
          <option value="Excellent">Excellent</option>
          <option value="On Track">On Track</option>
          <option value="Needs Attention">Needs Attention</option>
          <option value="At Risk">At Risk</option>
        </select>
      </div>

      {/* ── Table ── */}
      <div className="dash-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>ID</th>
                <th>Program</th>
                <th>Progress</th>
                <th>Quality</th>
                <th>Attendance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white",
                        s.gender === "FEMALE" ? "bg-gradient-to-br from-pink-400 to-rose-600" : "bg-gradient-primary"
                      )}>
                        {getInitials(s.name)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 whitespace-nowrap">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.parentName} • {s.parentPhone}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-gray-500">{s.studentId}</span>
                  </td>
                  <td>
                    <span className={cn("pill text-xs", programColors[s.program])}>
                      {s.program}
                    </span>
                  </td>
                  <td>
                    {s.currentJuz ? (
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-primary rounded-full"
                            style={{ width: `${(s.currentJuz / 30) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">Juz {s.currentJuz}/30</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      <span className="font-semibold text-gray-900 text-sm">{s.qualityScore}</span>
                    </div>
                  </td>
                  <td>
                    <span className={cn(
                      "text-sm font-semibold",
                      s.attendancePct >= 90 ? "text-green-600" : s.attendancePct >= 75 ? "text-amber-600" : "text-red-500"
                    )}>
                      {s.attendancePct}%
                    </span>
                  </td>
                  <td>
                    <span className={cn("pill", statusStyles[s.status])}>
                      {s.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/institute/students/${s.id}`}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 transition-colors"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing {Math.min((page - 1) * perPage + 1, filtered.length)}–
            {Math.min(page * perPage, filtered.length)} of {filtered.length} students
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-border hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  "h-8 w-8 rounded-lg text-sm font-medium transition-colors",
                  p === page ? "bg-primary text-white" : "hover:bg-gray-100 text-gray-600"
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-border hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
