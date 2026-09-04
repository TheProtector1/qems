import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface FeeReceiptData {
  invoiceNo: string;
  month: string;
  monthKey?: string | null;
  amount: number;
  grossAmount?: number;
  discount?: number;
  currency?: string;
  dueDate?: string;
  paidAt?: string | null;
  status: string;
  method?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
  sponsorName?: string | null;
  student: {
    name: string;
    studentId: string;
    program?: string;
    gender?: string;
  };
  parent?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  institute: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
  };
}

export function generateFeeReceiptPdf(data: FeeReceiptData): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const currency = data.currency || "PKR";

  // Palette
  const primaryColor: [number, number, number] = [27, 94, 32]; // #1B5E20 Dark Emerald
  const accentColor: [number, number, number] = [46, 125, 50]; // #2E7D32 Emerald
  const darkText: [number, number, number] = [31, 41, 55]; // #1F2937
  const mutedText: [number, number, number] = [107, 114, 128]; // #6B7280
  const lightBg: [number, number, number] = [243, 244, 246]; // #F3F4F6
  const successColor: [number, number, number] = [22, 101, 52]; // #166534

  // Outer Border
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.4);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Top Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(10, 10, pageWidth - 20, 24, "F");

  // Institute Name in Header
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(data.institute.name.toUpperCase(), pageWidth / 2, 20, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const contactParts = [
    data.institute.address,
    data.institute.city,
    data.institute.phone ? `Tel: ${data.institute.phone}` : "",
    data.institute.email ? `Email: ${data.institute.email}` : "",
  ].filter(Boolean);
  doc.text(contactParts.join(" | "), pageWidth / 2, 27, { align: "center" });

  // Receipt Title Bar
  let y = 42;
  doc.setFillColor(240, 253, 244); // light green
  doc.setDrawColor(187, 247, 208);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, y, pageWidth - 30, 14, 2, 2, "FD");

  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("OFFICIAL FEE RECEIPT / PAYMENT VOUCHER", pageWidth / 2, y + 9, { align: "center" });

  // Receipt Meta & Status
  y = 64;
  const col1Left = 16;
  const col2Left = pageWidth / 2 + 5;

  // Status Stamp Box
  const isPaid = data.status === "PAID";
  const isWaived = data.status === "WAIVED";
  const statusLabel = isPaid ? "PAID" : isWaived ? "100% SCHOLARSHIP" : data.status;

  doc.setFillColor(isPaid ? 220 : 254, isPaid ? 252 : 243, isPaid ? 231 : 199);
  doc.setDrawColor(isPaid ? 34 : 239, isPaid ? 197 : 68, isPaid ? 94 : 68);
  doc.setLineWidth(0.8);
  doc.roundedRect(pageWidth - 62, y - 2, 47, 18, 3, 3, "FD");

  doc.setTextColor(isPaid ? successColor[0] : 185, isPaid ? successColor[1] : 28, isPaid ? successColor[2] : 28);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(statusLabel, pageWidth - 38.5, y + 7, { align: "center" });

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text(
    data.paidAt ? `On: ${new Date(data.paidAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}` : "Status",
    pageWidth - 38.5,
    y + 13,
    { align: "center" }
  );

  // Left Meta Info
  doc.setTextColor(...darkText);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`Receipt / Invoice #: `, col1Left, y + 3);
  doc.setFont("helvetica", "normal");
  doc.text(data.invoiceNo, col1Left + 35, y + 3);

  doc.setFont("helvetica", "bold");
  doc.text(`Billing Month: `, col1Left, y + 10);
  doc.setFont("helvetica", "normal");
  doc.text(data.month || "—", col1Left + 35, y + 10);

  doc.setFont("helvetica", "bold");
  doc.text(`Due Date: `, col1Left, y + 17);
  doc.setFont("helvetica", "normal");
  doc.text(
    data.dueDate
      ? new Date(data.dueDate).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
      : "—",
    col1Left + 35,
    y + 17
  );

  // Divider Line
  y = 87;
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.4);
  doc.line(15, y, pageWidth - 15, y);

  // Student & Parent Information Section
  y = 94;
  doc.setFillColor(...lightBg);
  doc.roundedRect(15, y, pageWidth - 30, 30, 2, 2, "F");

  // Student details (Left side)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryColor);
  doc.text("STUDENT DETAILS", col1Left + 2, y + 6);

  doc.setTextColor(...darkText);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Student Name:", col1Left + 2, y + 13);
  doc.setFont("helvetica", "normal");
  doc.text(data.student.name, col1Left + 30, y + 13);

  doc.setFont("helvetica", "bold");
  doc.text("Student ID:", col1Left + 2, y + 19);
  doc.setFont("helvetica", "normal");
  doc.text(data.student.studentId, col1Left + 30, y + 19);

  doc.setFont("helvetica", "bold");
  doc.text("Program:", col1Left + 2, y + 25);
  doc.setFont("helvetica", "normal");
  doc.text(data.student.program || "Quran Studies", col1Left + 30, y + 25);

  // Parent details (Right side)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryColor);
  doc.text("PARENT / GUARDIAN", col2Left, y + 6);

  doc.setTextColor(...darkText);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Father / Guardian:", col2Left, y + 13);
  doc.setFont("helvetica", "normal");
  doc.text(data.parent?.name || "Parent", col2Left + 32, y + 13);

  doc.setFont("helvetica", "bold");
  doc.text("Contact Phone:", col2Left, y + 19);
  doc.setFont("helvetica", "normal");
  doc.text(data.parent?.phone || "—", col2Left + 32, y + 19);

  doc.setFont("helvetica", "bold");
  doc.text("Payment Method:", col2Left, y + 25);
  doc.setFont("helvetica", "normal");
  const methodText = data.method || (data.paymentMethod ? data.paymentMethod.replace(/_/g, " ") : isPaid ? "Cash" : "—");
  doc.text(data.sponsorName ? `${methodText} (via ${data.sponsorName})` : methodText, col2Left + 32, y + 25);

  // Fee Particulars Table
  y = 132;
  const gross = data.grossAmount ?? data.amount;
  const discount = data.discount ?? 0;
  const net = data.amount;

  const tableRows = [
    [
      "1",
      `Monthly Tuition Fee — ${data.month}`,
      `${currency} ${gross.toLocaleString()}`,
      discount > 0 ? `${currency} ${discount.toLocaleString()}` : "—",
      `${currency} ${net.toLocaleString()}`,
    ],
  ];

  autoTable(doc, {
    startY: y,
    head: [["Sr.", "Description / Particulars", "Gross Fee", "Discount / Concession", "Net Amount"]],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "center",
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 12 },
      1: { halign: "left", cellWidth: 80 },
      2: { halign: "right", cellWidth: 28 },
      3: { halign: "right", cellWidth: 32 },
      4: { halign: "right", cellWidth: 28, fontStyle: "bold" },
    },
    styles: {
      fontSize: 8.5,
      textColor: darkText,
      cellPadding: 4,
    },
    margin: { left: 15, right: 15 },
  });

  // Summary box below table
  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 155;
  y = finalY + 4;

  // Total Paid Banner Box
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.6);
  doc.roundedRect(pageWidth - 95, y, 80, 16, 2, 2, "FD");

  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("TOTAL AMOUNT PAID:", pageWidth - 90, y + 7);

  doc.setFontSize(12);
  doc.text(`${currency} ${net.toLocaleString()}`, pageWidth - 20, y + 12, { align: "right" });

  // Payment Notes & Details
  y += 24;
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(15, y, pageWidth - 30, 20, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...darkText);
  doc.text("PAYMENT NOTES & REMARKS:", col1Left + 2, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...mutedText);
  const notesText = data.notes || (isPaid ? "Payment received and recorded into QEMS ledger. Thank you." : "Pending clearance.");
  doc.text(notesText, col1Left + 2, y + 12);

  if (data.paidAt) {
    const paidDateStr = new Date(data.paidAt).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    doc.text(`Recorded Date: ${paidDateStr}`, col1Left + 2, y + 17);
  }

  // Signatures Area
  y += 34;
  const sigCol1 = 25;
  const sigCol2 = pageWidth - 65;

  doc.setDrawColor(156, 163, 175);
  doc.setLineWidth(0.3);
  doc.line(sigCol1, y + 12, sigCol1 + 45, y + 12);
  doc.line(sigCol2, y + 12, sigCol2 + 45, y + 12);

  doc.setTextColor(...mutedText);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text("Received By / Cashier", sigCol1 + 22.5, y + 17, { align: "center" });
  doc.text("Authorized Signature & Stamp", sigCol2 + 22.5, y + 17, { align: "center" });

  // Digital Verification Stamp
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.5);
  doc.circle(pageWidth / 2, y + 8, 12);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text("QEMS", pageWidth / 2, y + 6, { align: "center" });
  doc.text("OFFICIAL", pageWidth / 2, y + 9, { align: "center" });
  doc.text("VERIFIED", pageWidth / 2, y + 12, { align: "center" });

  // Footer / Du'a
  doc.setFillColor(...lightBg);
  doc.rect(10, pageHeight - 20, pageWidth - 20, 10, "F");

  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(
    "جَزَاكُمُ اللَّهُ خَيْرًا — JazakAllahu Khairan for supporting your child's Quranic journey",
    pageWidth / 2,
    pageHeight - 14,
    { align: "center" }
  );

  doc.setTextColor(...mutedText);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text(
    "This is a system-generated official receipt issued by Quran Education Management System (QEMS).",
    pageWidth / 2,
    pageHeight - 9,
    { align: "center" }
  );

  return doc;
}
