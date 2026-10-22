import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

/**
 * GET /api/institute/students/sample-sheet
 * Downloads a sample Excel (.xlsx) file with all required column headings
 * and 2 example rows showing accepted values.
 */
export async function GET() {
  // Column headers — must match what bulk-upload/route.ts reads
  const headers = [
    "Full Name",
    "Gender",
    "Date of Birth",
    "Father Name",
    "Parent Phone",
    "Parent Email",
    "Program",
    "City",
    "Address",
    "Current Juz",
    "Fee Amount",
  ];

  // Example rows
  const exampleRows = [
    {
      "Full Name": "Ahmed Ali Khan",
      "Gender": "Male",
      "Date of Birth": "2010-05-15",
      "Father Name": "Ali Hassan Khan",
      "Parent Phone": "03001234567",
      "Parent Email": "ali.hassan@example.com",
      "Program": "Hifz",
      "City": "Islamabad",
      "Address": "House 12, Street 4, F-8",
      "Current Juz": 5,
      "Fee Amount": 3000,
    },
    {
      "Full Name": "Fatima Noor",
      "Gender": "Female",
      "Date of Birth": "2012-09-20",
      "Father Name": "Noor Ahmed",
      "Parent Phone": "03009876543",
      "Parent Email": "noor.ahmed@example.com",
      "Program": "Nazra",
      "City": "Rawalpindi",
      "Address": "Flat 3, Block B, Satellite Town",
      "Current Juz": "",
      "Fee Amount": 2000,
    },
  ];

  const workbook = XLSX.utils.book_new();

  // Main data sheet
  const worksheet = XLSX.utils.json_to_sheet(exampleRows, { header: headers });

  // Style header row — set column widths
  const colWidths = [
    { wch: 22 }, // Full Name
    { wch: 10 }, // Gender
    { wch: 15 }, // Date of Birth
    { wch: 22 }, // Father Name
    { wch: 15 }, // Parent Phone
    { wch: 28 }, // Parent Email
    { wch: 12 }, // Program
    { wch: 14 }, // City
    { wch: 30 }, // Address
    { wch: 12 }, // Current Juz
    { wch: 12 }, // Fee Amount
  ];
  worksheet["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

  // Instructions sheet
  const instructions = [
    ["QEMS — Bulk Student Upload — Instructions"],
    [""],
    ["Required Columns:", "Description", "Accepted Values"],
    ["Full Name", "Student's full name", "Any text"],
    ["Gender", "Student's gender", "Male / Female"],
    ["Date of Birth", "Date in YYYY-MM-DD or DD/MM/YYYY format", "e.g. 2010-05-15"],
    ["Father Name", "Father or guardian full name", "Any text"],
    ["Parent Phone", "Pakistani mobile number", "e.g. 03001234567"],
    ["Program", "Quran program the student is enrolled in", "Hifz / Nazra / Tajweed"],
    [""],
    ["Optional Columns:", "Description", "Accepted Values"],
    ["Parent Email", "Parent's email address (optional)", "Any valid email"],
    ["City", "Student's city", "Any text"],
    ["Address", "Student's address", "Any text"],
    ["Current Juz", "Current memorisation position (Juz/Para)", "1-30 (Hifz only)"],
    ["Fee Amount", "Monthly fee in PKR", "Numeric amount, e.g. 3000"],
    [""],
    ["Notes:"],
    ["- Do not modify the column headers on the Students sheet."],
    ["- Phone numbers are used to match/create parent accounts."],
    ["- Default password for new parent logins: parent123"],
    ["- Default password for new student logins: student123"],
  ];

  const instrSheet = XLSX.utils.aoa_to_sheet(instructions);
  instrSheet["!cols"] = [{ wch: 25 }, { wch: 45 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(workbook, instrSheet, "Instructions");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=\"QEMS_Student_Upload_Sample.xlsx\"",
    },
  });
}
