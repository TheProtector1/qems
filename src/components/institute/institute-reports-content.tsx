"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { StudentReportsPanel } from "@/components/institute/student-reports-panel";

type StudentRow = {
  id: string;
  fullName: string;
  studentId: string;
  programType: string;
};

function programLabel(type: string) {
  if (type === "NAZRA") return "Nazra";
  if (type === "TAJWEED") return "Tajweed";
  return "Hifz";
}

export function InstituteReportsContent() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/institute/students")
      .then((res) => res.json())
      .then((data) => {
        const list = (data.students || []).map((s: StudentRow) => ({
          id: s.id,
          fullName: s.fullName,
          studentId: s.studentId,
          programType: s.programType,
        }));
        setStudents(list);
        if (list.length) setSelectedId(list[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const selected = students.find((s) => s.id === selectedId);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="section-heading flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary-700" /> Student Reports
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Generate PDF attendance and activity reports for parents. Available to institute owners, teachers, and super admins.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading students...
        </div>
      ) : students.length === 0 ? (
        <div className="dash-card p-12 text-center text-gray-500 text-sm">
          No students enrolled yet.{" "}
          <Link href="/institute/students/new" className="text-primary-700 font-semibold hover:underline">
            Add a student
          </Link>{" "}
          to generate reports.
        </div>
      ) : (
        <>
          <div className="dash-card p-4 bg-white">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Select Student</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="form-input max-w-md"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.studentId}) — {programLabel(s.programType)}
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <StudentReportsPanel
              studentId={selected.id}
              studentName={selected.fullName}
              program={programLabel(selected.programType)}
            />
          )}
        </>
      )}
    </div>
  );
}
