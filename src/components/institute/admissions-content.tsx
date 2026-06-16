"use client";

import { useState, useEffect } from "react";
import {
  ClipboardList, Plus, Clock, CheckCircle2, Eye, Search, Loader2, RefreshCw, XCircle, User, FileText, Phone, Mail, MapPin, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ApplicationRow {
  id: string;
  applicationNo: string;
  applicantName: string;
  gender: string;
  dateOfBirth: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  address: string;
  city: string;
  program: string;
  stage: "APPLIED" | "INTERVIEW_SCHEDULED" | "APPROVED" | "ENROLLED" | "REJECTED";
  notes: string;
  createdAt: string;
}

const stageConfig: Record<string, { label: string; pill: string }> = {
  APPLIED: { label: "Application Received", pill: "pill-info" },
  INTERVIEW_SCHEDULED: { label: "Interview Scheduled", pill: "pill-warning" },
  APPROVED: { label: "Approved", pill: "pill-success" },
  ENROLLED: { label: "Enrolled", pill: "pill-primary" },
  REJECTED: { label: "Rejected", pill: "pill-danger" },
};

// ─── Review Application Modal ─────────────────────────────────
function ReviewModal({
  application,
  onClose,
  onSave,
}: {
  application: ApplicationRow;
  onClose: () => void;
  onSave: () => void;
}) {
  const [stage, setStage] = useState(application.stage);
  const [notes, setNotes] = useState(application.notes || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/institute/admissions/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, notes }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update application.");
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary-700 to-primary-900 p-6 text-white flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold">Review Admission Application</h2>
            <p className="text-primary-200 text-xs mt-0.5">No: {application.applicationNo}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Details & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-500">Applicant:</span>
              <span className="font-bold text-gray-900">{application.applicantName} ({application.gender})</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-500">Program:</span>
              <span className="font-bold text-gray-900">{application.program}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-500">Parent/Guardian:</span>
              <span className="font-bold text-gray-900">{application.parentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-500">Contact:</span>
              <span className="font-bold text-gray-900">{application.parentPhone}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Pipeline Stage</label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as any)}
              className="form-input text-xs"
            >
              <option value="APPLIED">Application Received</option>
              <option value="INTERVIEW_SCHEDULED">Schedule Interview</option>
              <option value="APPROVED">Approve (Generates Student Profile)</option>
              <option value="ENROLLED">Enroll (Direct Admission)</option>
              <option value="REJECTED">Reject Application</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Reviewer Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add interview feedback, payment info, or review findings..."
              className="form-input text-xs resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost text-xs py-2 flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs py-2 flex-1 justify-center"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Content Component ───────────────────────────────────
export function AdmissionsContent() {
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [reviewingApp, setReviewingApp] = useState<ApplicationRow | null>(null);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/institute/admissions");
      if (!res.ok) throw new Error("Failed to load applications.");
      const data = await res.json();
      const rows = (data.applications || []).map((a: any) => ({
        id: a.id,
        applicationNo: a.applicationNo,
        applicantName: a.applicantName,
        gender: a.gender,
        dateOfBirth: a.dateOfBirth,
        parentName: a.parentName,
        parentPhone: a.parentPhone,
        parentEmail: a.parentEmail || "",
        address: a.address || "",
        city: a.city || "",
        program: a.program === "HIFZ" ? "Hifz" : a.program === "NAZRA" ? "Nazra" : "Tajweed",
        stage: a.stage,
        notes: a.notes || "",
        createdAt: a.createdAt
          ? new Date(a.createdAt).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
          : "—",
      }));
      setApplications(rows);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const filtered = applications.filter((a) =>
    a.applicantName.toLowerCase().includes(search.toLowerCase()) ||
    a.parentName.toLowerCase().includes(search.toLowerCase()) ||
    a.applicationNo.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    total: applications.length,
    interview: applications.filter((a) => a.stage === "INTERVIEW_SCHEDULED").length,
    approved: applications.filter((a) => a.stage === "APPROVED").length,
    enrolled: applications.filter((a) => a.stage === "ENROLLED").length,
  };

  return (
    <>
      {reviewingApp && (
        <ReviewModal
          application={reviewingApp}
          onClose={() => setReviewingApp(null)}
          onSave={fetchApplications}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-heading">Admission Pipeline</h2>
            <p className="text-sm text-gray-500 mt-0.5">Track applications from submission to enrollment</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost text-xs py-2" onClick={fetchApplications} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh
            </button>
            <Link href="/institute/students/admissions/new" className="btn-primary text-sm py-2" id="btn-new-application">
              <Plus className="h-4 w-4" /> New Application
            </Link>
          </div>
        </div>

        {/* Pipeline Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Applications", count: counts.total, color: "bg-blue-50 text-blue-700" },
            { label: "Interview", count: counts.interview, color: "bg-amber-50 text-amber-700" },
            { label: "Approved", count: counts.approved, color: "bg-green-50 text-green-700" },
            { label: "Enrolled", count: counts.enrolled, color: "bg-primary-50 text-primary-700" },
          ].map((s) => (
            <div key={s.label} className={cn("kpi-card p-4 flex items-center gap-3", s.color.split(" ")[0])}>
              <ClipboardList className={cn("h-8 w-8 opacity-70", s.color.split(" ")[1])} />
              <div>
                <p className={cn("font-display text-2xl font-bold", s.color.split(" ")[1])}>{s.count}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="dash-card p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              placeholder="Search applicants..."
              className="form-input pl-10 h-10 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="dash-card overflow-hidden bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
              <span className="text-sm">Loading applications...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-red-500">
              <p className="text-sm font-semibold">Failed to load pipeline</p>
              <p className="text-xs text-gray-400">{error}</p>
              <button onClick={fetchApplications} className="btn-ghost text-xs mt-2">Try Again</button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Student Name</th>
                  <th>Parent</th>
                  <th>Program</th>
                  <th>Stage</th>
                  <th>Applied On</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                      {applications.length === 0 ? "No applications in pipeline." : "No applications match your search."}
                    </td>
                  </tr>
                )}
                {filtered.map((a) => {
                  const cfg = stageConfig[a.stage] || stageConfig.APPLIED;
                  return (
                    <tr key={a.id}>
                      <td className="font-mono text-xs font-bold text-primary-700">{a.applicationNo}</td>
                      <td className="font-semibold text-gray-900">{a.applicantName}</td>
                      <td className="text-sm text-gray-600">{a.parentName}</td>
                      <td><span className="pill pill-primary text-[10px] py-0.5">{a.program}</span></td>
                      <td><span className={cn("pill text-[10px] py-0.5", cfg.pill)}>{cfg.label}</span></td>
                      <td className="text-xs text-gray-400">{a.createdAt}</td>
                      <td className="text-right">
                        <button
                          onClick={() => setReviewingApp(a)}
                          className="btn-ghost text-[10px] py-1 px-2.5 hover:bg-primary-50 transition-colors"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
