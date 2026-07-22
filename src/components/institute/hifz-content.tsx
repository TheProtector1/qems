"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Star, CheckCircle2, Clock, Save, RotateCcw, Loader2, RefreshCw, BookOpen,
} from "lucide-react";
import { cn, formatDate, getSurahName } from "@/lib/utils";
import { StudentAvatar } from "@/components/common/student-avatar";
import { HifzJuzGrid, ParaCompletionHistory } from "@/components/common/hifz-juz-grid";
import { HifzDirection } from "@prisma/client";
import {
  getHifzCompletionPercent,
  getNextPara,
  getDefaultStartingJuz,
  hifzDirectionLabel,
  type JuzCellState,
  type ParaCompletionInfo,
} from "@/lib/hifz-progress";
import { ParaCompletionModal } from "@/components/institute/para-completion-modal";
import { ShareToChatButton, useShareToChat } from "@/components/common/share-to-chat";
import { buildHifzMilestoneShare, buildStudentProgressShare } from "@/lib/share-templates";
import { HifzRevisionPlanPanel } from "@/components/institute/hifz-revision-panel";

const SABAQ_TYPES = [
  { value: "SABAQ", label: "Sabaq (New Lesson)", color: "text-green-600 bg-green-50 border-green-200" },
  { value: "SABQI", label: "Sabqi (Recent Revision)", color: "text-blue-600 bg-blue-50 border-blue-200" },
  { value: "MANZIL", label: "Manzil (Long-term Revision)", color: "text-purple-600 bg-purple-50 border-purple-200" },
];

type HifzStudent = {
  id: string;
  fullName: string;
  studentId: string;
  photo?: string | null;
  gender: string;
  currentJuz: number | null;
  currentPara: number | null;
  hifzDirection: HifzDirection | null;
  hifzCompletedAt: string | null;
  paraCompletions: ParaCompletionInfo[];
  targetCompletionDate: string | null;
};

type HifzRecordRow = {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  type: string;
  surahNumber: number;
  surahName: string;
  ayahFrom: number;
  ayahTo: number;
  lines: number | null;
  rating: number;
  errorCount: number;
  teacherNote: string | null;
  createdAt: string;
};

const typeColors: Record<string, string> = {
  SABAQ: "pill-success",
  SABQI: "pill-info",
  MANZIL: "pill-primary",
};

const typeLabels: Record<string, string> = {
  SABAQ: "Sabaq",
  SABQI: "Sabqi",
  MANZIL: "Manzil",
};

export function HifzContent({
  readOnly = false,
  apiBase = "/api/institute/hifz",
}: {
  readOnly?: boolean;
  apiBase?: string;
}) {
  const [students, setStudents] = useState<HifzStudent[]>([]);
  const [records, setRecords] = useState<HifzRecordRow[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [activeTab, setActiveTab] = useState<"tracker" | "entry" | "records" | "revision">("tracker");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avgRating, setAvgRating] = useState(0);
  const [paraModal, setParaModal] = useState<{
    open: boolean;
    mode: "complete" | "view";
    para: number;
    completion: ParaCompletionInfo | null;
  }>({ open: false, mode: "complete", para: 1, completion: null });
  const [paraSaving, setParaSaving] = useState(false);
  const { share, modal: shareModal } = useShareToChat();

  const [form, setForm] = useState({
    type: "SABAQ",
    surah: "21",
    ayahFrom: "",
    ayahTo: "",
    lines: "",
    rating: 5,
    errorCount: 0,
    note: "",
    /** Sabqi: null until teacher picks Done / Not done */
    sabqiCompleted: null as boolean | null,
    showSabqiDetails: false,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (selectedStudent) params.set("studentId", selectedStudent);

      const res = await fetch(`${apiBase}?${params}`);
      if (!res.ok) throw new Error("Failed to load hifz data.");

      const data = await res.json();
      setStudents(data.students || []);
      setRecords(data.records || []);
      setAvgRating(data.quality?.avgRating ?? 0);

      if (!selectedStudent && data.students?.length) {
        setSelectedStudent(data.students[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load hifz data.");
    } finally {
      setLoading(false);
    }
  }, [selectedStudent, apiBase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const student = students.find((s) => s.id === selectedStudent);
  const direction = student?.hifzDirection ?? HifzDirection.REVERSE;
  const hifzCompleted = Boolean(student?.hifzCompletedAt);
  const currentJuz =
    student?.currentPara ??
    student?.currentJuz ??
    (hifzCompleted ? null : getDefaultStartingJuz(direction));
  const paraCompletions = student?.paraCompletions ?? [];
  const completedParas = paraCompletions.map((c) => c.paraNumber);
  const paraDetails = Object.fromEntries(
    paraCompletions.map((c) => [c.paraNumber, c])
  ) as Record<number, ParaCompletionInfo>;
  const completionPct = getHifzCompletionPercent(direction, currentJuz, {
    completedCount: completedParas.length,
    hifzCompleted,
  });

  const studentRecords = records.filter((r) => r.studentId === selectedStudent);

  const handleParaClick = (para: number, state: JuzCellState, completion: ParaCompletionInfo | null) => {
    if (readOnly) {
      if (state === "completed" && completion) {
        setParaModal({ open: true, mode: "view", para, completion });
      }
      return;
    }
    if (state === "current" && !hifzCompleted) {
      setParaModal({ open: true, mode: "complete", para, completion: null });
    } else if (state === "completed" && completion) {
      setParaModal({ open: true, mode: "view", para, completion });
    }
  };

  const handleParaComplete = async (data: {
    daysToComplete: number;
    notes: string;
    completedAt: string;
  }) => {
    if (!selectedStudent) return;
    setParaSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/institute/hifz/para-completion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent,
          paraNumber: paraModal.para,
          daysToComplete: data.daysToComplete,
          notes: data.notes || undefined,
          completedAt: data.completedAt,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to mark para complete.");

      setParaModal((m) => ({ ...m, open: false }));
      await loadData();

      if (student) {
        const nextPara = getNextPara(direction, paraModal.para);
        const hifzComplete = body.hifzCompleted === true || nextPara === null;
        share(
          buildHifzMilestoneShare({
            studentName: student.fullName,
            studentCode: student.studentId,
            para: paraModal.para,
            daysToComplete: data.daysToComplete,
            notes: data.notes,
            completionPct: getHifzCompletionPercent(direction, nextPara ?? paraModal.para, {
              completedCount: (student.paraCompletions?.length || 0) + 1,
              hifzCompleted: hifzComplete,
            }),
            nextPara: hifzComplete ? null : nextPara,
            hifzComplete,
          }),
          { studentId: student.id }
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to mark para complete.");
    } finally {
      setParaSaving(false);
    }
  };

  const handleSave = async () => {
    if (!selectedStudent) {
      setError("Please select a student.");
      return;
    }

    const isSabqi = form.type === "SABQI";
    const useSimpleSabqi = isSabqi && !form.showSabqiDetails;

    if (useSimpleSabqi && form.sabqiCompleted === null) {
      setError("Mark Sabqi as Done or Not done.");
      return;
    }
    if (!useSimpleSabqi && (!form.ayahFrom || !form.ayahTo)) {
      setError("Please fill in surah, ayah range, and select a student.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = useSimpleSabqi
        ? {
            studentId: selectedStudent,
            type: "SABQI",
            simpleSabqi: true,
            sabqiCompleted: form.sabqiCompleted,
            rating: form.rating,
            errorCount: form.errorCount,
            teacherNote: form.note,
          }
        : {
            studentId: selectedStudent,
            type: form.type,
            surahNumber: form.surah,
            ayahFrom: form.ayahFrom,
            ayahTo: form.ayahTo,
            lines: form.lines,
            rating: form.rating,
            errorCount: form.errorCount,
            teacherNote: form.note,
            ...(isSabqi ? { simpleSabqi: false } : {}),
          };

      const res = await fetch("/api/institute/hifz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save record.");
      }

      setSaved(true);
      setForm({
        ...form,
        ayahFrom: "",
        ayahTo: "",
        lines: "",
        note: "",
        sabqiCompleted: null,
        showSabqiDetails: false,
      });
      setTimeout(() => setSaved(false), 2000);
      loadData();
      setActiveTab("records");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !students.length) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading hifz students...
      </div>
    );
  }

  if (!students.length) {
    return (
      <div className="dash-card p-12 text-center">
        <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="font-semibold text-gray-900 mb-1">No Hifz students enrolled</h3>
        <p className="text-sm text-gray-500">Enroll students in the Hifz program to start tracking progress.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-heading">Hifz Tracking</h2>
          <p className="text-sm text-gray-500 mt-0.5">{students.length} Hifz student{students.length !== 1 ? "s" : ""} from your institute</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost text-sm py-2" onClick={loadData} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="form-input w-full sm:w-64 max-w-md"
            id="select-student"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.fullName}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">{error}</div>
      )}

      {student && (
        <div className="dash-card p-6 bg-gradient-to-r from-primary-50 to-emerald-50 border-primary-100">
          <div className="flex items-start gap-6">
            <StudentAvatar name={student.fullName} gender={student.gender} photo={student.photo} size="lg" />
            <div className="flex-1">
              <h3 className="font-display text-xl font-bold text-gray-900">{student.fullName}</h3>
              <p className="text-sm text-gray-500 mb-1">
                {student.studentId} ·{" "}
                {hifzCompleted ? "Hifz Complete" : `Para ${currentJuz || 0} / 30`}
              </p>
              <p className="text-xs text-gray-400 mb-4">{hifzDirectionLabel(direction)}</p>
              {!readOnly && (
                <div className="mb-4">
                  <ShareToChatButton
                    draft={buildStudentProgressShare({
                      studentName: student.fullName,
                      studentCode: student.studentId,
                      program: "Hifz",
                      progress: hifzCompleted
                        ? "Hifz complete"
                        : `Para ${currentJuz || 0}/30 · ${completionPct}%`,
                    })}
                    studentId={student.id}
                    label="Share progress"
                  />
                </div>
              )}
              <div className="flex items-center gap-6 flex-wrap">
                <div>
                  <p className="text-xs text-gray-400">Progress</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-primary-700">{completionPct}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Avg. Rating</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                    <span className="font-bold text-gray-900">{avgRating ? avgRating.toFixed(1) : "—"} / 5</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Records</p>
                  <p className="font-bold text-primary-700 mt-1">{studentRecords.length}</p>
                </div>
                {student.targetCompletionDate && (
                  <div>
                    <p className="text-xs text-gray-400">Target Completion</p>
                    <p className="font-bold text-amber-600 mt-1">{formatDate(student.targetCompletionDate)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: "tracker", label: "Juz Progress Map" },
          ...(!readOnly ? [{ key: "revision", label: "Revision Plan" }] : []),
          ...(!readOnly ? [{ key: "entry", label: "Record Lesson" }] : []),
          { key: "records", label: "Recent Records" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as typeof activeTab)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === t.key ? "bg-white text-primary-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "revision" && !readOnly && (
        <HifzRevisionPlanPanel
          onSelectStudent={(id) => {
            setSelectedStudent(id);
            setActiveTab("entry");
          }}
        />
      )}

      {activeTab === "tracker" && student && (
        <div className="dash-card p-6">
          <HifzJuzGrid
            direction={direction}
            currentJuz={currentJuz}
            interactive={!readOnly}
            hifzCompleted={hifzCompleted}
            completedParas={completedParas}
            paraDetails={paraDetails}
            onParaClick={handleParaClick}
          />
          <div className="flex items-center gap-6 text-xs text-gray-500 mt-6 flex-wrap">
            <span className="flex items-center gap-2"><span className="h-4 w-4 rounded-md bg-primary-600 inline-block" />Memorised</span>
            <span className="flex items-center gap-2"><span className="h-4 w-4 rounded-md bg-primary-300 inline-block border border-primary-500" />Current para — click to mark complete (days + notes)</span>
            <span className="flex items-center gap-2"><span className="h-4 w-4 rounded-md bg-gray-100 inline-block border" />Upcoming</span>
          </div>
          <ParaCompletionHistory completions={paraCompletions} />
        </div>
      )}

      <ParaCompletionModal
        key={`${paraModal.mode}-${paraModal.para}-${paraModal.open}`}
        open={paraModal.open}
        mode={paraModal.mode}
        para={paraModal.para}
        direction={direction}
        completion={paraModal.completion}
        onClose={() => setParaModal((m) => ({ ...m, open: false }))}
        onSubmit={handleParaComplete}
        submitting={paraSaving}
      />
      {shareModal}

      {activeTab === "entry" && (
        <div className="dash-card p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Record Today&apos;s Lesson</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Type</label>
              <div className="grid grid-cols-3 gap-3">
                {SABAQ_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        type: t.value,
                        sabqiCompleted: t.value === "SABQI" ? form.sabqiCompleted : null,
                        showSabqiDetails: t.value === "SABQI" ? form.showSabqiDetails : false,
                      })
                    }
                    className={cn(
                      "rounded-xl border-2 p-3 text-sm font-medium transition-all text-left",
                      form.type === t.value ? t.color + " border-current" : "border-gray-200 text-gray-500 hover:border-gray-300"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {form.type === "SABQI" && (
              <div className="md:col-span-2 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Sabqi — current para revision
                    {currentJuz ? (
                      <span className="text-gray-400 font-normal"> (Para {currentJuz})</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    Mark whether today&apos;s Sabqi was completed. Ayah details are optional.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, sabqiCompleted: true })}
                      className={cn(
                        "rounded-xl border-2 py-4 text-sm font-semibold transition-all",
                        form.sabqiCompleted === true
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                          : "border-gray-200 text-gray-500 hover:border-emerald-300"
                      )}
                    >
                      <CheckCircle2 className="h-5 w-5 mx-auto mb-1" />
                      Done
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, sabqiCompleted: false })}
                      className={cn(
                        "rounded-xl border-2 py-4 text-sm font-semibold transition-all",
                        form.sabqiCompleted === false
                          ? "border-amber-600 bg-amber-50 text-amber-800"
                          : "border-gray-200 text-gray-500 hover:border-amber-300"
                      )}
                    >
                      <Clock className="h-5 w-5 mx-auto mb-1" />
                      Not done
                    </button>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={form.showSabqiDetails}
                    onChange={(e) => setForm({ ...form, showSabqiDetails: e.target.checked })}
                  />
                  Add surah / ayah details
                </label>
              </div>
            )}

            {(form.type !== "SABQI" || form.showSabqiDetails) && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Surah</label>
                  <select value={form.surah} onChange={(e) => setForm({ ...form, surah: e.target.value })} className="form-input">
                    {Array.from({ length: 114 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n}. {getSurahName(n)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Lines Covered</label>
                  <input type="number" min={1} value={form.lines} onChange={(e) => setForm({ ...form, lines: e.target.value })} placeholder="e.g. 8" className="form-input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ayah From</label>
                  <input type="number" min={1} value={form.ayahFrom} onChange={(e) => setForm({ ...form, ayahFrom: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ayah To</label>
                  <input type="number" min={1} value={form.ayahTo} onChange={(e) => setForm({ ...form, ayahTo: e.target.value })} className="form-input" />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Teacher Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button key={r} type="button" onClick={() => setForm({ ...form, rating: r })} className="transition-transform hover:scale-110">
                    <Star className={cn("h-8 w-8", r <= form.rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200")} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Error Count</label>
              <input type="number" min={0} value={form.errorCount} onChange={(e) => setForm({ ...form, errorCount: +e.target.value })} className="form-input" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Teacher Notes</label>
              <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={3} className="form-input resize-none" />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
                {saved ? <><CheckCircle2 className="h-4 w-4" /> Saved!</> :
                 saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> :
                 <><Save className="h-4 w-4" /> Save Record</>}
              </button>
              <button
                onClick={() =>
                  setForm({
                    ...form,
                    ayahFrom: "",
                    ayahTo: "",
                    lines: "",
                    note: "",
                    sabqiCompleted: null,
                    showSabqiDetails: false,
                  })
                }
                className="btn-ghost"
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "records" && (
        <div className="dash-card overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="font-semibold text-gray-900">Hifz Records</h3>
            <p className="text-xs text-gray-500 mt-0.5">{records.length} record{records.length !== 1 ? "s" : ""} in database</p>
          </div>
          {records.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">No hifz records yet. Record a lesson to get started.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Type</th>
                  <th>Surah / Ayahs</th>
                  <th>Lines</th>
                  <th>Rating</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium text-gray-900">{r.studentName}</td>
                    <td><span className={cn("pill", typeColors[r.type])}>{typeLabels[r.type]}</span></td>
                    <td>
                      {r.ayahFrom === 0 && r.ayahTo === 0 ? (
                        <>
                          <p className="text-gray-700">{r.surahName}</p>
                          <p className="text-xs text-gray-400">
                            {r.teacherNote?.startsWith("Sabqi not done")
                              ? "Not done"
                              : r.teacherNote?.startsWith("Sabqi done")
                                ? "Done"
                                : "Para revision"}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-gray-700">{r.surahName}</p>
                          <p className="text-xs text-gray-400">{r.surahNumber}:{r.ayahFrom}–{r.ayahTo}</p>
                        </>
                      )}
                    </td>
                    <td>{r.lines ?? "—"}</td>
                    <td>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={cn("h-3.5 w-3.5", s <= r.rating ? "text-amber-400 fill-amber-400" : "text-gray-200")} />
                        ))}
                      </div>
                    </td>
                    <td className="text-gray-400 text-xs">{formatDate(r.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
