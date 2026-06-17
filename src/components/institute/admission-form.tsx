"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User, Users, BookOpen, CheckCircle2, ChevronRight,
  ChevronLeft, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StudentPhotoUpload } from "@/components/common/student-photo-upload";

// ── Types ────────────────────────────────────────────────────
type FormData = {
  // Step 1: Student Info
  fullName: string;
  gender: string;
  dateOfBirth: string;
  nationality: string;
  address: string;
  photo: string;
  // Step 2: Parent Info
  fatherName: string;
  motherName: string;
  parentPhone: string;
  parentEmail: string;
  parentCnic: string;
  // Step 3: Program Info
  program: string;
  class: string;
  teacher: string;
  feeAmount: string;
  scholarshipPct: string;
  startDate: string;
  notes: string;
};

const INITIAL: FormData = {
  fullName: "",
  gender: "MALE",
  dateOfBirth: "",
  nationality: "Pakistani",
  address: "",
  photo: "",
  fatherName: "",
  motherName: "",
  parentPhone: "",
  parentEmail: "",
  parentCnic: "",
  program: "Hifz",
  class: "Hifz A",
  teacher: "",
  feeAmount: "3500",
  scholarshipPct: "0",
  startDate: new Date().toISOString().split("T")[0],
  notes: "",
};

const STEPS = [
  { id: 1, label: "Student Info", icon: User },
  { id: 2, label: "Parent Details", icon: Users },
  { id: 3, label: "Program & Fees", icon: BookOpen },
  { id: 4, label: "Confirmation", icon: CheckCircle2 },
];

const CLASS_OPTIONS: Record<string, string[]> = {
  Hifz: ["Hifz A", "Hifz B", "Hifz C", "Hifz Girls"],
  Nazra: ["Nazra 1", "Nazra 2", "Nazra 3", "Nazra Girls"],
  Tajweed: ["Tajweed Beginners", "Tajweed Intermediate", "Tajweed Advanced"],
};

const FEE_DEFAULTS: Record<string, string> = {
  Hifz: "3500",
  Nazra: "2500",
  Tajweed: "2000",
};

type AdmissionFormProps = {
  mode?: "enroll" | "application";
};

export function AdmissionForm({ mode = "enroll" }: AdmissionFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [generatedId, setGeneratedId] = useState("");
  const [teachers, setTeachers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/institute/teachers")
      .then((res) => res.json())
      .then((data) => {
        setTeachers(data.teachers || []);
      })
      .catch((err) => console.error(err));
  }, []);

  const set = (key: keyof FormData, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Auto-update class/teacher/fee when program changes
      if (key === "program") {
        next.class = CLASS_OPTIONS[value]?.[0] || "";
        next.feeAmount = FEE_DEFAULTS[value] || "3500";
        next.teacher = "";
      }
      return next;
    });
  };

  const canProceed = () => {
    if (step === 1) return form.fullName.trim() && form.dateOfBirth && form.gender;
    if (step === 2) return form.fatherName.trim() && form.parentPhone.trim();
    if (step === 3) return form.program && form.class && form.startDate;
    return true;
  };

  const selectedTeacherName = teachers.find((t) => t.id === form.teacher)?.name
    || teachers.find((t) => t.id === form.teacher)?.user?.name
    || "Unassigned";

  const validTeacherId = teachers.some((t) => t.id === form.teacher) ? form.teacher : null;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const isApplication = mode === "application";
      const res = await fetch(
        isApplication ? "/api/institute/admissions" : "/api/institute/students",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isApplication
              ? {
                  applicantName: form.fullName,
                  gender: form.gender,
                  dateOfBirth: form.dateOfBirth,
                  parentName: form.fatherName,
                  parentPhone: form.parentPhone,
                  parentEmail: form.parentEmail,
                  address: form.address,
                  city: form.address ? undefined : "Islamabad",
                  program: form.program,
                  notes: form.notes,
                }
              : {
                  fullName: form.fullName,
                  gender: form.gender,
                  dateOfBirth: form.dateOfBirth,
                  address: form.address,
                  city: "Islamabad",
                  fatherName: form.fatherName,
                  parentPhone: form.parentPhone,
                  parentEmail: form.parentEmail,
                  program: form.program,
                  teacherId: validTeacherId,
                  feeAmount: form.feeAmount,
                  scholarshipPct: form.scholarshipPct,
                  photo: form.photo || null,
                }
          ),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit admission.");
      }

      const data = await res.json();
      setGeneratedId(
        isApplication
          ? data.application?.applicationNo || "APP-NEW"
          : data.student?.studentId || "STU-NEW"
      );
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
      setStep(3); // Go back to step 3 where they can review or click submit again
    } finally {
      setSubmitting(false);
    }
  };

  const netFee =
    Math.round(
      parseInt(form.feeAmount || "0") *
        (1 - parseInt(form.scholarshipPct || "0") / 100)
    );


  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 dash-card p-12">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">
          {mode === "application" ? "Application Submitted!" : "Admission Submitted!"}
        </h2>
        <p className="text-gray-500 mb-2">
          <strong>{form.fullName}</strong> has been successfully{" "}
          {mode === "application" ? "submitted for review in the" : "admitted to the"}{" "}
          <strong>{form.program}</strong> program.
        </p>
        <p className="text-sm font-mono text-primary-700 bg-primary-50 rounded-xl px-4 py-2 inline-block mb-8 border border-primary-100">
          {mode === "application" ? "Application No" : "Student ID"}: {generatedId}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push(mode === "application" ? "/institute/students/admissions" : "/institute/students")}
            className="btn-ghost text-sm py-2.5"
          >
            {mode === "application" ? "View Applications" : "View All Students"}
          </button>
          <button
            onClick={() => {
              setForm(INITIAL);
              setStep(1);
              setSubmitted(false);
            }}
            className="btn-primary text-sm py-2.5"
          >
            Add Another Student
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ── Step Indicator ── */}
      <div className="flex items-center justify-between">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isDone = step > s.id;
          return (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 text-sm font-bold",
                    isDone
                      ? "bg-green-500 text-white"
                      : isActive
                      ? "bg-gradient-primary text-white shadow-md"
                      : "bg-gray-100 text-gray-400"
                  )}
                >
                  {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                </div>
                <span
                  className={cn(
                    "text-[11px] font-semibold whitespace-nowrap",
                    isActive ? "text-primary-800" : isDone ? "text-green-600" : "text-gray-400"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-3 mb-5 rounded-full transition-colors duration-300",
                    isDone ? "bg-green-400" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Form Card ── */}
      <div className="dash-card p-8 bg-white">
        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}
        {/* Step 1: Student Information */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="mb-6">
              <h3 className="font-display text-xl font-bold text-gray-900">Student Personal Information</h3>
              <p className="text-sm text-gray-500 mt-0.5">Enter the student's basic identification details</p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <StudentPhotoUpload
                  name={form.fullName || "Student"}
                  gender={form.gender}
                  value={form.photo || null}
                  onChange={(photo) => set("photo", photo || "")}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ahmad Raza Khan"
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  className="form-input"
                  id="input-full-name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Gender <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  {["MALE", "FEMALE"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => set("gender", g)}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all",
                        form.gender === g
                          ? "border-primary-600 bg-primary-50 text-primary-800"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      )}
                    >
                      {g === "MALE" ? "👦 Male" : "👧 Female"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => set("dateOfBirth", e.target.value)}
                  className="form-input"
                  id="input-dob"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nationality</label>
                <input
                  type="text"
                  placeholder="e.g. Pakistani"
                  value={form.nationality}
                  onChange={(e) => set("nationality", e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Home Address</label>
                <textarea
                  placeholder="Street address, city..."
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  rows={2}
                  className="form-input resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Parent / Guardian Details */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="mb-6">
              <h3 className="font-display text-xl font-bold text-gray-900">Parent / Guardian Details</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                These details will be used to create the parent portal login
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Father's Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Muhammad Raza"
                  value={form.fatherName}
                  onChange={(e) => set("fatherName", e.target.value)}
                  className="form-input"
                  id="input-father-name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mother's Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sadia Raza"
                  value={form.motherName}
                  onChange={(e) => set("motherName", e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Contact Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 0300-1234567"
                  value={form.parentPhone}
                  onChange={(e) => set("parentPhone", e.target.value)}
                  className="form-input"
                  id="input-parent-phone"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="parent@email.com"
                  value={form.parentEmail}
                  onChange={(e) => set("parentEmail", e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Parent CNIC / ID Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 42101-1234567-9"
                  value={form.parentCnic}
                  onChange={(e) => set("parentCnic", e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Program, Class & Fee */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="mb-6">
              <h3 className="font-display text-xl font-bold text-gray-900">Program & Fee Structure</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Assign the student to a program, class, and configure their monthly fee
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {/* Program */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Program Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["Hifz", "Nazra", "Tajweed"].map((prog) => (
                    <button
                      key={prog}
                      type="button"
                      onClick={() => set("program", prog)}
                      className={cn(
                        "py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all text-left flex flex-col gap-1",
                        form.program === prog
                          ? "border-primary-600 bg-primary-50 text-primary-800"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      )}
                    >
                      <span className="text-lg">{prog === "Hifz" ? "📖" : prog === "Nazra" ? "🕌" : "🎓"}</span>
                      <span>{prog}</span>
                      <span className="text-[10px] font-normal opacity-60">
                        {prog === "Hifz"
                          ? "Quran Memorization"
                          : prog === "Nazra"
                          ? "Quran Reading"
                          : "Recitation Rules"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Class / Section <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.class}
                  onChange={(e) => set("class", e.target.value)}
                  className="form-input"
                  id="select-class"
                >
                  {(CLASS_OPTIONS[form.program] || []).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Assigned Teacher
                </label>
                <select
                  value={form.teacher}
                  onChange={(e) => set("teacher", e.target.value)}
                  className="form-input text-xs"
                  id="select-teacher"
                >
                  <option value="">Select a Teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name || t.user?.name || "Teacher"}</option>
                  ))}
                </select>
              </div>


              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Admission / Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                  className="form-input"
                  id="input-start-date"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Monthly Fee (PKR)</label>
                <input
                  type="number"
                  value={form.feeAmount}
                  onChange={(e) => set("feeAmount", e.target.value)}
                  className="form-input"
                  min={0}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Scholarship Discount (%)
                </label>
                <input
                  type="number"
                  value={form.scholarshipPct}
                  onChange={(e) => set("scholarshipPct", e.target.value)}
                  className="form-input"
                  min={0}
                  max={100}
                />
              </div>

              {parseInt(form.scholarshipPct || "0") > 0 && (
                <div className="md:col-span-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                  <span className="font-semibold">Net Monthly Fee after {form.scholarshipPct}% scholarship:</span>
                  {" "}PKR {netFee.toLocaleString()}
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Admission Notes (optional)
                </label>
                <textarea
                  placeholder="Any special notes, medical needs, previous Hifz progress..."
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  rows={2}
                  className="form-input resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation Summary */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="mb-6">
              <h3 className="font-display text-xl font-bold text-gray-900">Review & Confirm Admission</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Please verify all the details before finalizing the admission
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Student Summary */}
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User className="h-3.5 w-3.5" /> Student Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Full Name</span>
                    <span className="font-semibold text-gray-900">{form.fullName || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Gender</span>
                    <span className="font-semibold text-gray-900">{form.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date of Birth</span>
                    <span className="font-semibold text-gray-900">{form.dateOfBirth || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nationality</span>
                    <span className="font-semibold text-gray-900">{form.nationality}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{mode === "application" ? "Reference" : "Student ID"}</span>
                    <span className="font-mono text-primary-700 font-bold text-xs">
                      {mode === "application" ? "Assigned on approval" : "Assigned on submit"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Parent Summary */}
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" /> Parent / Guardian
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Father's Name</span>
                    <span className="font-semibold text-gray-900">{form.fatherName || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mother's Name</span>
                    <span className="font-semibold text-gray-900">{form.motherName || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone</span>
                    <span className="font-semibold text-gray-900">{form.parentPhone || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <span className="font-semibold text-gray-900 truncate max-w-[140px]">{form.parentEmail || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Program Summary */}
              <div className="md:col-span-2 rounded-2xl bg-primary-50 border border-primary-100 p-5">
                <h4 className="text-xs font-semibold text-primary-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5" /> Program & Fee Assignment
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-primary-500 text-xs">Program</p>
                    <p className="font-bold text-primary-900">{form.program}</p>
                  </div>
                  <div>
                    <p className="text-primary-500 text-xs">Class</p>
                    <p className="font-bold text-primary-900">{form.class}</p>
                  </div>
                  <div>
                    <p className="text-primary-500 text-xs">Assigned Teacher</p>
                    <p className="font-bold text-primary-900">{selectedTeacherName}</p>
                  </div>
                  <div>
                    <p className="text-primary-500 text-xs">Start Date</p>
                    <p className="font-bold text-primary-900">{form.startDate}</p>
                  </div>
                  <div>
                    <p className="text-primary-500 text-xs">Monthly Fee</p>
                    <p className="font-bold text-primary-900">PKR {parseInt(form.feeAmount || "0").toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-primary-500 text-xs">Scholarship</p>
                    <p className="font-bold text-primary-900">{form.scholarshipPct}%</p>
                  </div>
                  <div>
                    <p className="text-primary-500 text-xs">Net Monthly Fee</p>
                    <p className="font-bold text-green-700">PKR {netFee.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation Buttons ── */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="btn-ghost text-sm py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        <div className="flex items-center gap-2">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                step === s.id ? "w-8 bg-primary-600" : step > s.id ? "w-4 bg-green-400" : "w-4 bg-gray-200"
              )}
            />
          ))}
        </div>

        {step < 4 ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(4, s + 1))}
            disabled={!canProceed()}
            className="btn-primary text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next Step
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary text-sm py-2.5"
            id="btn-submit-admission"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {mode === "application" ? "Submit Application" : "Confirm Admission"}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
