/** Professional chat message templates for sharing updates with parents & stakeholders. */

export type ShareCategory =
  | "progress"
  | "hifz"
  | "attendance"
  | "assessment"
  | "fee"
  | "report"
  | "general";

export type ShareDraft = {
  category: ShareCategory;
  title: string;
  body: string;
  /** Optional short label shown in the share UI */
  subtitle?: string;
};

const CATEGORY_LABEL: Record<ShareCategory, string> = {
  progress: "Progress update",
  hifz: "Hifz milestone",
  attendance: "Attendance notice",
  assessment: "Assessment result",
  fee: "Fee reminder",
  report: "Report ready",
  general: "Update",
};

export function shareCategoryLabel(category: ShareCategory) {
  return CATEGORY_LABEL[category];
}

function line(label: string, value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  return `• ${label}: ${value}`;
}

export function formatShareMessage(draft: ShareDraft, opts?: { senderName?: string; instituteHint?: string }) {
  const header = `📌 ${draft.title}`;
  const meta = [
    line("Type", CATEGORY_LABEL[draft.category]),
    draft.subtitle ? line("Student", draft.subtitle) : null,
  ]
    .filter(Boolean)
    .join("\n");

  const footer = [
    opts?.senderName ? `— ${opts.senderName}` : null,
    "Sent via QEMS Communication",
  ]
    .filter(Boolean)
    .join("\n");

  return [header, meta, "", draft.body.trim(), "", footer].filter((p) => p !== undefined).join("\n");
}

export function buildStudentProgressShare(input: {
  studentName: string;
  studentCode?: string;
  program?: string;
  progress?: string;
  teacher?: string;
  attendanceRate?: string | number;
  extraNotes?: string;
}): ShareDraft {
  const lines = [
    line("Program", input.program),
    line("Progress", input.progress),
    line("Teacher", input.teacher),
    line("Attendance", input.attendanceRate != null ? `${input.attendanceRate}%` : null),
    input.extraNotes?.trim() || null,
  ].filter(Boolean);

  return {
    category: "progress",
    title: `Update on ${input.studentName}`,
    subtitle: input.studentCode ? `${input.studentName} (${input.studentCode})` : input.studentName,
    body: lines.join("\n") || `Please find the latest update regarding ${input.studentName}.`,
  };
}

export function buildHifzMilestoneShare(input: {
  studentName: string;
  studentCode?: string;
  para: number;
  daysToComplete?: number;
  notes?: string;
  completionPct?: number;
  nextPara?: number | null;
  hifzComplete?: boolean;
}): ShareDraft {
  const lines = [
    line("Milestone", input.hifzComplete ? "Full Hifz completed — Alhamdulillah" : `Para ${input.para} completed`),
    line("Days taken", input.daysToComplete),
    line("Overall progress", input.completionPct != null ? `${input.completionPct}%` : null),
    input.nextPara != null ? line("Now studying", `Para ${input.nextPara}`) : null,
    input.notes?.trim() ? `Notes: ${input.notes.trim()}` : null,
  ].filter(Boolean);

  return {
    category: "hifz",
    title: input.hifzComplete
      ? `Alhamdulillah — ${input.studentName} completed Hifz`
      : `${input.studentName} completed Para ${input.para}`,
    subtitle: input.studentCode ? `${input.studentName} (${input.studentCode})` : input.studentName,
    body: lines.join("\n"),
  };
}

export function buildAttendanceShare(input: {
  date: string;
  absentees: { name: string; studentCode?: string }[];
  presentCount?: number;
  totalCount?: number;
}): ShareDraft {
  if (input.absentees.length === 1) {
    const s = input.absentees[0];
    return {
      category: "attendance",
      title: `Absence notice — ${s.name}`,
      subtitle: s.studentCode ? `${s.name} (${s.studentCode})` : s.name,
      body: [
        line("Date", input.date),
        line("Status", "Absent"),
        "",
        "Please contact the institute if this absence was unexpected, or share a leave note if needed.",
      ].join("\n"),
    };
  }

  const list = input.absentees
    .map((s) => `• ${s.name}${s.studentCode ? ` (${s.studentCode})` : ""}`)
    .join("\n");

  return {
    category: "attendance",
    title: `Attendance summary — ${input.date}`,
    body: [
      line("Present", input.presentCount != null && input.totalCount != null ? `${input.presentCount}/${input.totalCount}` : null),
      line("Absent", input.absentees.length),
      "",
      "Absent students:",
      list,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export function buildAssessmentShare(input: {
  studentName: string;
  examTitle?: string;
  score?: string | number;
  grade?: string;
  remarks?: string;
}): ShareDraft {
  return {
    category: "assessment",
    title: `Assessment result — ${input.studentName}`,
    subtitle: input.studentName,
    body: [
      line("Exam", input.examTitle),
      line("Score", input.score),
      line("Grade", input.grade),
      input.remarks?.trim() ? `Remarks: ${input.remarks.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export function buildReportShare(input: {
  studentName: string;
  reportLabel: string;
  dateFrom?: string;
  dateTo?: string;
}): ShareDraft {
  return {
    category: "report",
    title: `${input.reportLabel} ready — ${input.studentName}`,
    subtitle: input.studentName,
    body: [
      `A ${input.reportLabel.toLowerCase()} has been prepared for ${input.studentName}.`,
      line("Period", input.dateFrom && input.dateTo ? `${input.dateFrom} → ${input.dateTo}` : null),
      "",
      "Please open the Parent Portal or contact the institute if you would like a PDF copy.",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export function buildFeeShare(input: {
  studentName: string;
  amount?: string | number;
  dueDate?: string;
  status?: string;
  month?: string;
}): ShareDraft {
  return {
    category: "fee",
    title: `Fee reminder — ${input.studentName}`,
    subtitle: input.studentName,
    body: [
      line("Month", input.month),
      line("Amount", input.amount),
      line("Due date", input.dueDate),
      line("Status", input.status),
      "",
      "Kindly arrange payment at your earliest convenience. JazakAllahu khairan.",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}
