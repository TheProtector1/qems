import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { ProgramType, ProgressStartType } from "@prisma/client";
import { formatDate, getSurahName } from "@/lib/utils";
import { progressSummaryLabel } from "@/lib/student-progress";

export type ReportType = "attendance" | "hifz" | "combined";

export type StudentReportData = {
  instituteName: string;
  student: {
    fullName: string;
    studentId: string;
    programType: ProgramType;
    progressStartType: ProgressStartType | null;
    previousInstitute: string | null;
    currentJuz: number | null;
    currentPara: number | null;
    currentSurah: number | null;
    currentPage: number | null;
    teacherName: string;
    parentName: string;
    parentEmail: string | null;
  };
  period: { from: string; to: string };
  attendance: {
    rows: Array<{ date: string; status: string }>;
    present: number;
    absent: number;
    late: number;
    leave: number;
    rate: number;
  };
  hifz: {
    rows: Array<{
      date: string;
      type: string;
      surah: string;
      ayahs: string;
      rating: number;
      errors: number;
    }>;
    avgRating: number;
  };
  nazra: {
    rows: Array<{
      date: string;
      surah: string;
      pages: string;
      readingAccuracy: number;
      tajweedAccuracy: number;
      fluency: number;
    }>;
    avgReading: number;
  };
  tajweed: {
    rows: Array<{
      rule: string;
      category: string;
      mastered: string;
      score: string;
    }>;
    masteredCount: number;
    totalRules: number;
  };
  generatedBy: string;
  generatedAt: Date;
};

function addHeader(doc: jsPDF, title: string, data: StudentReportData) {
  doc.setFillColor(22, 101, 52);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("QEMS — Student Progress Report", 14, 12);
  doc.setFontSize(10);
  doc.text(data.instituteName, 14, 19);
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(14);
  doc.text(title, 14, 38);
  doc.setFontSize(10);
  doc.text(`${data.student.fullName} (${data.student.studentId})`, 14, 46);
  doc.text(`Program: ${data.student.programType} · Period: ${formatDate(data.period.from)} – ${formatDate(data.period.to)}`, 14, 52);
}

function addStudentInfo(doc: jsPDF, data: StudentReportData, startY: number) {
  autoTable(doc, {
    startY,
    head: [["Field", "Value"]],
    body: [
      ["Student", data.student.fullName],
      ["Student ID", data.student.studentId],
      ["Program", data.student.programType],
      ["Progress", progressSummaryLabel(data.student.programType, data.student)],
      ["Teacher", data.student.teacherName],
      ["Parent / Guardian", data.student.parentName],
      ["Parent Email", data.student.parentEmail || "—"],
    ],
    theme: "grid",
    headStyles: { fillColor: [22, 101, 52] },
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });
}

function addAttendanceSection(doc: jsPDF, data: StudentReportData, startY: number) {
  doc.setFontSize(12);
  doc.setTextColor(22, 101, 52);
  doc.text("Attendance Summary", 14, startY);
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(
    `Present: ${data.attendance.present} · Absent: ${data.attendance.absent} · Late: ${data.attendance.late} · Leave: ${data.attendance.leave} · Rate: ${data.attendance.rate}%`,
    14,
    startY + 6
  );

  autoTable(doc, {
    startY: startY + 10,
    head: [["Date", "Status"]],
    body: data.attendance.rows.length
      ? data.attendance.rows.map((r) => [formatDate(r.date), r.status])
      : [["—", "No attendance records in this period"]],
    theme: "striped",
    headStyles: { fillColor: [22, 101, 52] },
    styles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });
}

function addHifzSection(doc: jsPDF, data: StudentReportData, startY: number) {
  doc.setFontSize(12);
  doc.setTextColor(22, 101, 52);
  doc.text("Hifz / Quran Memorization", 14, startY);
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(`Average lesson rating: ${data.hifz.avgRating ? data.hifz.avgRating.toFixed(1) : "—"} / 5`, 14, startY + 6);

  autoTable(doc, {
    startY: startY + 10,
    head: [["Date", "Type", "Surah", "Ayahs", "Rating", "Errors"]],
    body: data.hifz.rows.length
      ? data.hifz.rows.map((r) => [formatDate(r.date), r.type, r.surah, r.ayahs, String(r.rating), String(r.errors)])
      : [["—", "—", "No hifz records in this period", "—", "—", "—"]],
    theme: "striped",
    headStyles: { fillColor: [22, 101, 52] },
    styles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });
}

function addNazraSection(doc: jsPDF, data: StudentReportData, startY: number) {
  doc.setFontSize(12);
  doc.setTextColor(22, 101, 52);
  doc.text("Nazra Reading Progress", 14, startY);
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(
    `Average reading accuracy: ${data.nazra.avgReading ? data.nazra.avgReading.toFixed(1) : "—"}%`,
    14,
    startY + 6
  );

  autoTable(doc, {
    startY: startY + 10,
    head: [["Date", "Surah", "Pages", "Reading %", "Tajweed %", "Fluency"]],
    body: data.nazra.rows.length
      ? data.nazra.rows.map((r) => [
          formatDate(r.date),
          r.surah,
          r.pages,
          `${r.readingAccuracy.toFixed(1)}%`,
          `${r.tajweedAccuracy.toFixed(1)}%`,
          String(r.fluency),
        ])
      : [["—", "No nazra records in this period", "—", "—", "—", "—"]],
    theme: "striped",
    headStyles: { fillColor: [22, 101, 52] },
    styles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });
}

function addTajweedSection(doc: jsPDF, data: StudentReportData, startY: number) {
  doc.setFontSize(12);
  doc.setTextColor(22, 101, 52);
  doc.text("Tajweed Mastery", 14, startY);
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(
    `Mastered rules: ${data.tajweed.masteredCount} / ${data.tajweed.totalRules || "—"}`,
    14,
    startY + 6
  );

  autoTable(doc, {
    startY: startY + 10,
    head: [["Rule", "Category", "Mastered", "Practice Score"]],
    body: data.tajweed.rows.length
      ? data.tajweed.rows.map((r) => [r.rule, r.category, r.mastered, r.score])
      : [["—", "No tajweed records yet", "—", "—"]],
    theme: "striped",
    headStyles: { fillColor: [22, 101, 52] },
    styles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });
}

function addProgramActivitySection(doc: jsPDF, data: StudentReportData, startY: number) {
  if (data.student.programType === ProgramType.HIFZ) {
    addHifzSection(doc, data, startY);
    return;
  }
  if (data.student.programType === ProgramType.NAZRA) {
    addNazraSection(doc, data, startY);
    return;
  }
  if (data.student.programType === ProgramType.TAJWEED) {
    addTajweedSection(doc, data, startY);
    return;
  }
  doc.setFontSize(10);
  doc.text("No program activity section available.", 14, startY);
}

function addFooter(doc: jsPDF, data: StudentReportData) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Generated by ${data.generatedBy} on ${data.generatedAt.toLocaleString("en-PK")} · Page ${i} of ${pageCount}`,
      14,
      290
    );
    doc.text("Confidential — For parent/guardian use", 14, 295);
  }
}

export function buildStudentReportPdf(type: ReportType, data: StudentReportData): Uint8Array {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const titles: Record<ReportType, string> = {
    attendance: "Attendance Report",
    hifz: "Hifz Progress Report",
    combined: "Combined Student Report",
  };

  addHeader(doc, titles[type], data);
  let y = 58;

  if (type === "combined") {
    addStudentInfo(doc, data, y);
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  }

  if (type === "attendance" || type === "combined") {
    addAttendanceSection(doc, data, y);
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
    if (type === "combined" && y > 240) {
      doc.addPage();
      y = 20;
    }
  }

  if (type === "hifz" || type === "combined") {
    if (type === "hifz") {
      addStudentInfo(doc, data, y);
      y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
    }
    addProgramActivitySection(doc, data, y);
  }

  addFooter(doc, data);
  return doc.output("arraybuffer") as unknown as Uint8Array;
}

export function programTypeLabel(type: ProgramType) {
  if (type === ProgramType.NAZRA) return "Nazra";
  if (type === ProgramType.TAJWEED) return "Tajweed";
  return "Hifz";
}

export { getSurahName };
