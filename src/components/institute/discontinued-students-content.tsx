"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  UserX, Search, Loader2, RotateCcw, ChevronLeft, ChevronRight,
  ClipboardList, ShieldAlert, LogOut, Eye,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { StudentAvatar } from "@/components/common/student-avatar";
import { STUDENT_STATUS_META } from "@/lib/student-status";

type DiscontinuedStudent = {
  id: string;
  studentId: string;
  fullName: string;
  photo: string | null;
  gender: string;
  programType: string;
  status: "TERMINATED" | "DISMISSED" | "WITHDRAWN";
  statusReason: string | null;
  retentionAttempts: string | null;
  statusUpdatedAt: string | null;
  admissionDate: string;
  teacher: { user: { name: string } } | null;
  parent: { user: { name: string; phone: string | null; email: string | null } } | null;
};

type Summary = { total: number; terminated: number; dismissed: number; withdrawn: number };

function programLabel(type: string) {
  if (type === "NAZRA") return "Nazra";
  if (type === "TAJWEED") return "Tajweed";
  return "Hifz";
}

const STATUS_TABS: Array<{ value: string; label: string; icon: React.ElementType }> = [
  { value: "ALL", label: "All", icon: UserX },
  { value: "TERMINATED", label: "Terminated", icon: ShieldAlert },
  { value: "DISMISSED", label: "Dismissed", icon: ShieldAlert },
  { value: "WITHDRAWN", label: "Withdrawn", icon: LogOut },
];

export function DiscontinuedStudentsContent() {
  const { data: session } = useSession();
  const canManage = ["SUPER_ADMIN", "INSTITUTE_OWNER", "BRANCH_MANAGER"].includes(
    session?.user?.role || ""
  );

  const [students, setStudents] = useState<DiscontinuedStudent[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, terminated: 0, dismissed: 0, withdrawn: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusTab, setStatusTab] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusTab !== "ALL") params.set("status", statusTab);
      const res = await fetch(`/api/institute/students/discontinued?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setStudents(data.students || []);
      setSummary(data.summary || { total: 0, terminated: 0, dismissed: 0, withdrawn: 0 });
      setTotalPages(data.pagination?.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusTab]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debouncedSearch, statusTab]);

  const reactivate = async (student: DiscontinuedStudent) => {
    if (!confirm(`Reactivate ${student.fullName}? This will mark them as an active student again.`)) return;
    setReactivatingId(student.id);
    try {
      const res = await fetch(`/api/institute/students/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to reactivate student.");
      }
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reactivate student.");
    } finally {
      setReactivatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-heading flex items-center gap-2">
          <UserX className="h-6 w-6 text-red-600" /> Dismissed &amp; Discontinued Students
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Students whose enrollment ended by termination, dismissal, or withdrawal — with the reason and
          retention attempts documented for each case. Graduated and transferred students appear under Alumni.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: summary.total, color: "text-gray-900" },
          { label: "Terminated", value: summary.terminated, color: "text-red-600" },
          { label: "Dismissed", value: summary.dismissed, color: "text-red-700" },
          { label: "Withdrawn", value: summary.withdrawn, color: "text-gray-500" },
        ].map((s) => (
          <div key={s.label} className="dash-card p-4 bg-white">
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="dash-card p-4 bg-white flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or student ID..."
            className="form-input pl-9 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusTab(tab.value)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors",
                statusTab === tab.value
                  ? "border-red-600 bg-red-50 text-red-800"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading students...
        </div>
      ) : students.length === 0 ? (
        <div className="dash-card p-12 text-center text-gray-500 text-sm">
          <UserX className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          No dismissed or discontinued students{statusTab !== "ALL" ? ` in the "${STUDENT_STATUS_META[statusTab as keyof typeof STUDENT_STATUS_META]?.label}" status` : ""}.
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((s) => {
            const meta = STUDENT_STATUS_META[s.status];
            const expanded = expandedId === s.id;
            return (
              <div key={s.id} className="dash-card bg-white p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <StudentAvatar name={s.fullName} gender={s.gender} photo={s.photo} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{s.fullName}</h3>
                      <span className="text-xs font-mono text-gray-400">{s.studentId}</span>
                      <span className={cn("pill text-[10px] py-0", meta.pill)}>{meta.label}</span>
                      <span className="pill pill-muted text-[10px] py-0">{programLabel(s.programType)}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {s.statusUpdatedAt ? `Status changed ${formatDate(s.statusUpdatedAt)}` : `Enrolled ${formatDate(s.admissionDate)}`}
                      {s.teacher?.user?.name ? ` · Teacher: ${s.teacher.user.name}` : ""}
                    </p>

                    <div className={cn("mt-3 grid gap-3 text-sm", expanded ? "sm:grid-cols-2" : "sm:grid-cols-2")}>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Reason</p>
                        <p className={cn("text-gray-700", !expanded && "line-clamp-2")}>
                          {s.statusReason || "No reason recorded."}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                          <ClipboardList className="h-3 w-3" /> Retention attempts
                        </p>
                        <p className={cn("text-gray-700", !expanded && "line-clamp-2")}>
                          {s.retentionAttempts || "Not documented."}
                        </p>
                      </div>
                    </div>
                    {(s.statusReason?.length ?? 0) > 90 || (s.retentionAttempts?.length ?? 0) > 90 ? (
                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : s.id)}
                        className="text-[11px] font-semibold text-primary-700 hover:underline mt-1"
                      >
                        {expanded ? "Show less" : "Show more"}
                      </button>
                    ) : null}
                  </div>

                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <Link
                      href={`/institute/students/${s.id}`}
                      className="btn-ghost text-xs py-1.5 px-3 justify-center"
                    >
                      <Eye className="h-3.5 w-3.5" /> View profile
                    </Link>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => reactivate(s)}
                        disabled={reactivatingId === s.id}
                        className="btn-primary text-xs py-1.5 px-3 justify-center disabled:opacity-50"
                      >
                        {reactivatingId === s.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" />
                        )}
                        Reactivate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-40"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
