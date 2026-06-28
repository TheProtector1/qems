import { Prisma, StudentDocumentCategory } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

export type DocumentInput = {
  category: string;
  label?: string | null;
  fileName: string;
  mimeType: string;
  fileSize?: number;
  fileData: string;
};

const VALID_CATEGORIES = new Set<string>(Object.values(StudentDocumentCategory));
const MAX_FILE_CHARS = 3_000_000;

export function validateDocumentInput(doc: DocumentInput): string | null {
  if (!doc.category || !VALID_CATEGORIES.has(doc.category)) {
    return "Invalid document category.";
  }
  if (!doc.fileName?.trim() || !doc.mimeType?.trim() || !doc.fileData?.trim()) {
    return "Document file data is incomplete.";
  }
  if (!doc.fileData.startsWith("data:")) {
    return "Invalid file format.";
  }
  if (doc.fileData.length > MAX_FILE_CHARS) {
    return "File is too large. Please upload a smaller document.";
  }
  if (doc.category === "OTHER" && !doc.label?.trim()) {
    return "Please provide a name for other documents.";
  }
  return null;
}

export function estimateFileSize(fileData: string, fileSize?: number): number {
  if (fileSize && fileSize > 0) return fileSize;
  const base64 = fileData.includes(",") ? fileData.split(",")[1] : fileData;
  return Math.round((base64.length * 3) / 4);
}

type Tx = PrismaClient | Prisma.TransactionClient;

export async function createStudentDocuments(
  tx: Tx,
  studentId: string,
  documents: DocumentInput[],
  uploadedById?: string
) {
  if (!documents?.length) return [];

  const rows = documents.map((doc) => {
    const err = validateDocumentInput(doc);
    if (err) throw new Error(err);
    return {
      studentId,
      category: doc.category as StudentDocumentCategory,
      label: doc.label?.trim() || null,
      fileName: doc.fileName.trim(),
      mimeType: doc.mimeType.trim(),
      fileSize: estimateFileSize(doc.fileData, doc.fileSize),
      fileData: doc.fileData,
      uploadedById: uploadedById || null,
    };
  });

  await tx.studentDocument.createMany({ data: rows });
  return tx.studentDocument.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    select: documentSelect,
  });
}

export const documentSelect = {
  id: true,
  category: true,
  label: true,
  fileName: true,
  mimeType: true,
  fileSize: true,
  createdAt: true,
  uploadedBy: { select: { name: true } },
} as const;

export function serializeDocument(doc: {
  id: string;
  category: string;
  label: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: Date;
  uploadedBy?: { name: string } | null;
}) {
  return {
    id: doc.id,
    category: doc.category,
    label: doc.label,
    fileName: doc.fileName,
    mimeType: doc.mimeType,
    fileSize: doc.fileSize,
    createdAt: doc.createdAt.toISOString(),
    uploadedByName: doc.uploadedBy?.name || null,
  };
}
