"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User, Users, BookOpen, CheckCircle2, ChevronRight,
  ChevronLeft, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StudentPhotoUpload } from "@/components/common/student-photo-upload";
import { ClassAssignmentField, classNamesFromIds, type InstituteClassOption } from "@/components/institute/class-assignment-field";
import {
  StudentDocumentsManager,
  type PendingStudentDocument,
} from "@/components/institute/student-documents-manager";
import { HIFZ_DIRECTION_OPTIONS, getDefaultStartingJuz } from "@/lib/hifz-progress";

// ── Types ────────────────────────────────────────────────────
type FormData = {
  // Step 1: Student Info
  fullName: string;
  gender: string;
  dateOfBirth: string;
  nationality: string;
  city: string;
  country: string;
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
  classIds: string[];
  teacher: string;
  feeAmount: string;
  scholarshipPct: string;
  startDate: string;
  notes: string;
  progressStartType: string;
  previousInstitute: string;
  hifzDirection: string;
  currentJuz: string;
  currentPara: string;
  currentSurah: string;
  currentPage: string;
};

const INITIAL: FormData = {
  fullName: "",
  gender: "MALE",
  dateOfBirth: "",
  nationality: "Pakistani",
  city: "",
  country: "Pakistan",
  address: "",
  photo: "",
  fatherName: "",
  motherName: "",
  parentPhone: "",
  parentEmail: "",
  parentCnic: "",
  program: "Hifz",
  classIds: [],
  teacher: "",
  feeAmount: "3500",
  scholarshipPct: "0",
  startDate: new Date().toISOString().split("T")[0],
  notes: "",
  progressStartType: "NEW",
  previousInstitute: "",
  hifzDirection: "REVERSE",
  currentJuz: "30",
  currentPara: "30",
  currentSurah: "1",
  currentPage: "1",
};

const STEPS = [
  { id: 1, label: "Student Info", icon: User },
  { id: 2, label: "Parent Details", icon: Users },
  { id: 3, label: "Program & Fees", icon: BookOpen },
  { id: 4, label: "Confirmation", icon: CheckCircle2 },
];

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
  const [portalCredentials, setPortalCredentials] = useState<{
    parentEmail: string;
    parentPassword: string;
    studentEmail?: string;
    studentPassword?: string;
  } | null>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<InstituteClassOption[]>([]);
  const [pendingDocuments, setPendingDocuments] = useState<PendingStudentDocument[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/institute/teachers").then((res) => res.json()),
      fetch("/api/institute/classes").then((res) => res.json()),
    ])
      .then(([teacherData, classData]) => {
        setTeachers(teacherData.teachers || []);
        setClasses(classData.classes || []);
      })
      .catch((err) => console.error(err));
  }, []);

  const set = (key: keyof FormData, value: string | string[]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "program" && typeof value === "string") {
        const programType = value.toUpperCase();
        next.classIds = prev.classIds.filter(
          (id) => classes.find((c) => c.id === id)?.programType === programType
        );
        next.feeAmount = FEE_DEFAULTS[value] || "3500";
        next.teacher = "";
      }
      return next;
    });
  };

  const setClassIds = (classIds: string[]) => {
    setForm((prev) => {
      const next = { ...prev, classIds };
      if (!next.teacher && classIds.length >= 1) {
        const cls = classes.find((c) => c.id === classIds[0]);
        const teacherId = cls?.teacherId || cls?.teacher?.id;
        if (teacherId && teachers.some((t) => t.id === teacherId)) {
          next.teacher = teacherId;
        }
      }
      return next;
    });
  };

  const canProceed = () => {
    if (step === 1) return form.fullName.trim() && form.dateOfBirth && form.gender;
    if (step === 2) return form.fatherName.trim() && form.parentPhone.trim();
    if (step === 3) return form.program && form.startDate;
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
                  city: form.city,
                  country: form.country,
                  address: form.address,
                  program: form.program,
                  notes: form.notes,
                }
              : {
                  fullName: form.fullName,
                  gender: form.gender,
                  dateOfBirth: form.dateOfBirth,
                  address: form.address,
                  city: form.city,
                  country: form.country,
                  fatherName: form.fatherName,
                  parentPhone: form.parentPhone,
                  parentEmail: form.parentEmail,
                  program: form.program,
                  teacherId: validTeacherId,
                  classIds: form.classIds,
                  feeAmount: form.feeAmount,
                  scholarshipPct: form.scholarshipPct,
                  photo: form.photo || null,
                  progressStartType: form.progressStartType,
                  previousInstitute: form.progressStartType === "CONTINUING" ? form.previousInstitute : undefined,
                  hifzDirection: form.program === "Hifz" ? form.hifzDirection : undefined,
                  currentJuz: form.program === "Hifz" && form.progressStartType === "CONTINUING" ? form.currentJuz : undefined,
                  currentPara: form.program === "Hifz" && form.progressStartType === "CONTINUING" ? (form.currentPara || form.currentJuz) : undefined,
                  currentSurah: form.program === "Nazra" ? form.currentSurah : undefined,
                  currentPage: form.program === "Nazra" ? form.currentPage : undefined,
                  documents: pendingDocuments.map(({ category, label, fileName, mimeType, fileSize, fileData }) => ({
                    category,
                    label,
                    fileName,
                    mimeType,
                    fileSize,
                    fileData,
                  })),
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
      if (!isApplication && data.parentPortal) {
        setPortalCredentials({
          parentEmail: data.parentPortal.parentEmail,
          parentPassword: data.parentPortal.defaultPassword,
          studentEmail: data.studentPortal?.email,
          studentPassword: data.studentPortal?.defaultPassword,
        });
      }
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
        <p className="text-sm font-mono text-primary-700 bg-primary-50 rounded-xl px-4 py-2 inline-block mb-4 border border-primary-100">
          {mode === "application" ? "Application No" : "Student ID"}: {generatedId}
        </p>

        {portalCredentials && (
          <div className="text-left rounded-2xl bg-amber-50 border border-amber-200 p-5 mb-6 space-y-3">
            <h3 className="font-semibold text-amber-900 text-sm">Parent Portal Login</h3>
            <p className="text-xs text-amber-800">
              Parents sign in at <strong>/auth/login</strong> using:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white rounded-lg p-2 border border-amber-100">
                <p className="text-gray-500">Email</p>
                <p className="font-mono font-semibold text-gray-900 break-all">{portalCredentials.parentEmail}</p>
              </div>
              <div className="bg-white rounded-lg p-2 border border-amber-100">
                <p className="text-gray-500">Password</p>
                <p className="font-mono font-semibold text-gray-900">{portalCredentials.parentPassword}</p>
              </div>
            </div>
            {portalCredentials.studentEmail && (
              <>
                <h3 className="font-semibold text-amber-900 text-sm pt-2">Student Portal Login</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white rounded-lg p-2 border border-amber-100">
                    <p className="text-gray-500">Email</p>
                    <p className="font-mono font-semibold text-gray-900 break-all">{portalCredentials.studentEmail}</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-amber-100">
                    <p className="text-gray-500">Password</p>
                    <p className="font-mono font-semibold text-gray-900">{portalCredentials.studentPassword}</p>
                  </div>
                </div>
              </>
            )}
            <p className="text-[10px] text-amber-700">Ask parents to change their password after first login.</p>
          </div>
        )}

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
              setPortalCredentials(null);
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
      <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
      <div className="flex items-center justify-between min-w-[20rem] sm:min-w-0">
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
                    "text-[10px] sm:text-[11px] font-semibold whitespace-nowrap",
                    isActive ? "text-primary-800" : isDone ? "text-green-600" : "text-gray-400"
                  )}
                >
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">Step {s.id}</span>
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
      </div>

      {/* ── Form Card ── */}
      <div className="dash-card p-4 sm:p-6 lg:p-8 bg-white">
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

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">City</label>
                <input
                  type="text"
                  placeholder="e.g. Karachi"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Country</label>
                <input
                  type="text"
                  placeholder="e.g. Pakistan"
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
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
                  Contact Phone (portal login) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 0300-1234567"
                  value={form.parentPhone}
                  onChange={(e) => set("parentPhone", e.target.value)}
                  className="form-input"
                  id="input-parent-phone"
                />
                <p className="text-[10px] text-gray-400 mt-1">Parents sign in with this mobile number</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Email Address <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="parent@email.com"
                  value={form.parentEmail}
                  onChange={(e) => set("parentEmail", e.target.value)}
                  className="form-input"
                />
                <p className="text-[10px] text-gray-400 mt-1">Used for fee and attendance alerts only</p>
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

              <div className="md:col-span-2 border-t border-gray-100 pt-5 mt-2">
                <StudentDocumentsManager
                  pendingDocuments={pendingDocuments}
                  onPendingChange={setPendingDocuments}
                  compact
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

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Assign to Class(es)
                </label>
                <ClassAssignmentField
                  classes={classes}
                  program={form.program}
                  selectedIds={form.classIds}
                  onChange={setClassIds}
                />
                <p className="text-[10px] text-gray-400 mt-1.5">
                  Select one or more institute classes. Students appear in attendance and character-building for those classes.
                </p>
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

              {/* Progress start */}
              <div className="md:col-span-2 border-t border-gray-100 pt-5 mt-2">
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Quran Progress at Admission
                </label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { value: "NEW", label: "Starting Fresh", desc: "Begin from the start of the program" },
                    { value: "CONTINUING", label: "Continuing Elsewhere", desc: "Transfer with existing progress" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set("progressStartType", opt.value)}
                      className={cn(
                        "py-3 px-4 rounded-xl border-2 text-left transition-all",
                        form.progressStartType === opt.value
                          ? "border-primary-600 bg-primary-50 text-primary-800"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      )}
                    >
                      <span className="text-sm font-semibold block">{opt.label}</span>
                      <span className="text-[10px] opacity-70">{opt.desc}</span>
                    </button>
                  ))}
                </div>

                {form.program === "Hifz" && (
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Hifz Memorisation Order
                    </label>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {HIFZ_DIRECTION_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            const start = String(getDefaultStartingJuz(opt.value));
                            setForm((f) => ({
                              ...f,
                              hifzDirection: opt.value,
                              ...(f.progressStartType === "NEW"
                                ? { currentJuz: start, currentPara: start }
                                : {}),
                            }));
                          }}
                          className={cn(
                            "py-3 px-4 rounded-xl border-2 text-left transition-all",
                            form.hifzDirection === opt.value
                              ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                              : "border-gray-200 text-gray-500 hover:border-gray-300"
                          )}
                        >
                          <span className="text-sm font-semibold block">{opt.label}</span>
                          <span className="text-[10px] opacity-80 leading-snug block mt-0.5">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                    {form.progressStartType === "NEW" && (
                      <p className="text-xs text-emerald-700 mt-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                        Will start at <strong>Para {form.hifzDirection === "REVERSE" ? "30 (Juz Amma)" : "1 (Al-Baqarah)"}</strong>
                      </p>
                    )}
                  </div>
                )}

                {form.progressStartType === "CONTINUING" && (
                  <div className="grid md:grid-cols-2 gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Previous Institute / Madrasa</label>
                      <input
                        type="text"
                        placeholder="e.g. Jamia Ashrafia, local mosque hifz class..."
                        value={form.previousInstitute}
                        onChange={(e) => set("previousInstitute", e.target.value)}
                        className="form-input"
                      />
                    </div>
                    {form.program === "Hifz" && (
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Current Para / Juz (1–30)
                        </label>
                        <p className="text-[10px] text-gray-500 mb-2">
                          {form.hifzDirection === "REVERSE"
                            ? "Which para is the student currently memorising? (e.g. 25 if they finished Amma through Para 26)"
                            : "Which para is the student currently memorising? (e.g. 5 if they completed Para 1–4)"}
                        </p>
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={form.currentPara || form.currentJuz}
                          onChange={(e) => {
                            set("currentPara", e.target.value);
                            set("currentJuz", e.target.value);
                          }}
                          className="form-input max-w-xs"
                        />
                      </div>
                    )}
                    {form.program === "Nazra" && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Current Surah (1–114)</label>
                          <input type="number" min={1} max={114} value={form.currentSurah} onChange={(e) => set("currentSurah", e.target.value)} className="form-input" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Current Mushaf Page</label>
                          <input type="number" min={1} max={604} value={form.currentPage} onChange={(e) => set("currentPage", e.target.value)} className="form-input" />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

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
                    <p className="text-primary-500 text-xs">Class(es)</p>
                    <p className="font-bold text-primary-900">
                      {classNamesFromIds(classes, form.classIds)}
                    </p>
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
