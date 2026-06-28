"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileText, Upload, Trash2, Eye, Loader2, Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  STUDENT_DOCUMENT_CATEGORIES,
  STUDENT_DOCUMENT_GROUPS,
  documentDisplayName,
  getDocumentCategoryMeta,
} from "@/lib/student-document-categories";
import {
  formatFileSize,
  isImageMime,
  processDocumentFile,
} from "@/lib/document-file";

export type PendingStudentDocument = {
  clientId: string;
  category: string;
  label?: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileData: string;
};

export type SavedStudentDocument = {
  id: string;
  category: string;
  label?: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  uploadedByName?: string | null;
};

type StudentDocumentsManagerProps = {
  studentId?: string;
  pendingDocuments?: PendingStudentDocument[];
  onPendingChange?: (docs: PendingStudentDocument[]) => void;
  readOnly?: boolean;
  compact?: boolean;
};

export function StudentDocumentsManager({
  studentId,
  pendingDocuments = [],
  onPendingChange,
  readOnly = false,
  compact = false,
}: StudentDocumentsManagerProps) {
  const isPendingMode = !studentId;
  const [saved, setSaved] = useState<SavedStudentDocument[]>([]);
  const [loading, setLoading] = useState(Boolean(studentId));
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState(STUDENT_DOCUMENT_CATEGORIES[0].value);
  const [customLabel, setCustomLabel] = useState("");
  const [preview, setPreview] = useState<{
    title: string;
    mimeType: string;
    fileData: string;
    fileName: string;
  } | null>(null);

  const categoryMeta = getDocumentCategoryMeta(category);

  const loadDocuments = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/institute/students/${studentId}/documents`);
      if (!res.ok) throw new Error("Failed to load documents.");
      const data = await res.json();
      setSaved(data.documents || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const allDocuments = useMemo(() => {
    const pending = pendingDocuments.map((d) => ({
      id: d.clientId,
      category: d.category,
      label: d.label,
      fileName: d.fileName,
      mimeType: d.mimeType,
      fileSize: d.fileSize,
      createdAt: "",
      isPending: true,
    }));
    const persisted = saved.map((d) => ({ ...d, isPending: false }));
    return [...pending, ...persisted];
  }, [pendingDocuments, saved]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof allDocuments>();
    for (const group of STUDENT_DOCUMENT_GROUPS) {
      map.set(group, []);
    }
    for (const doc of allDocuments) {
      const meta = getDocumentCategoryMeta(doc.category);
      const list = map.get(meta.group) || [];
      list.push(doc);
      map.set(meta.group, list);
    }
    return STUDENT_DOCUMENT_GROUPS.map((group) => ({
      group,
      items: map.get(group) || [],
    })).filter((g) => g.items.length > 0 || !compact);
  }, [allDocuments, compact]);

  const handleFile = async (file: File | undefined) => {
    if (!file || readOnly) return;
    setUploading(true);
    setError(null);
    try {
      const processed = await processDocumentFile(file);
      const payload = {
        category,
        label: category === "OTHER" ? customLabel.trim() : undefined,
        ...processed,
      };

      if (category === "OTHER" && !customLabel.trim()) {
        throw new Error("Please enter a document name for Other documents.");
      }

      if (isPendingMode) {
        onPendingChange?.([
          ...pendingDocuments,
          {
            clientId: `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            category,
            label: payload.label,
            fileName: payload.fileName,
            mimeType: payload.mimeType,
            fileSize: payload.fileSize,
            fileData: payload.fileData,
          },
        ]);
        setCustomLabel("");
        return;
      }

      const res = await fetch(`/api/institute/students/${studentId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents: [payload] }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed.");
      }
      setCustomLabel("");
      await loadDocuments();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = async (doc: (typeof allDocuments)[number]) => {
    if (readOnly) return;
    if (doc.isPending) {
      onPendingChange?.(pendingDocuments.filter((d) => d.clientId !== doc.id));
      return;
    }
    if (!studentId) return;
    if (!confirm("Remove this document?")) return;
    try {
      const res = await fetch(
        `/api/institute/students/${studentId}/documents/${doc.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete document.");
      await loadDocuments();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  const openPreview = async (doc: (typeof allDocuments)[number]) => {
    if (doc.isPending) {
      const pending = pendingDocuments.find((d) => d.clientId === doc.id);
      if (!pending) return;
      setPreview({
        title: documentDisplayName(pending.category, pending.label),
        mimeType: pending.mimeType,
        fileData: pending.fileData,
        fileName: pending.fileName,
      });
      return;
    }
    if (!studentId) return;
    try {
      const res = await fetch(
        `/api/institute/students/${studentId}/documents/${doc.id}`
      );
      if (!res.ok) throw new Error("Could not load document.");
      const data = await res.json();
      setPreview({
        title: documentDisplayName(doc.category, doc.label),
        mimeType: data.document.mimeType,
        fileData: data.document.fileData,
        fileName: data.document.fileName,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Preview failed.");
    }
  };

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className={cn("font-semibold text-gray-900", compact ? "text-sm" : "text-base")}>
            Identity & Admission Documents
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            CNIC, B-Form, certificates, and other records. JPG, PNG, WebP, or PDF.
          </p>
        </div>
        {!readOnly && (
          <span className="pill pill-info text-[10px] shrink-0">
            {allDocuments.length} file{allDocuments.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
          {error}
        </div>
      )}

      {!readOnly && (
        <div className="rounded-xl border border-dashed border-primary-200 bg-primary-50/40 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Document type
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-input text-xs"
              >
                {STUDENT_DOCUMENT_GROUPS.map((group) => (
                  <optgroup key={group} label={group}>
                    {STUDENT_DOCUMENT_CATEGORIES.filter((c) => c.group === group).map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {"hint" in categoryMeta && categoryMeta.hint ? (
                <p className="text-[10px] text-gray-400 mt-1">{categoryMeta.hint}</p>
              ) : null}
            </div>

            {category === "OTHER" && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Document name
                </label>
                <input
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="e.g. Power of attorney letter"
                  className="form-input text-xs"
                />
              </div>
            )}
          </div>

          <label
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary-300 bg-white px-4 py-6 cursor-pointer hover:bg-primary-50/50 transition-colors",
              uploading && "opacity-60 pointer-events-none"
            )}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            {uploading ? (
              <Loader2 className="h-6 w-6 text-primary-600 animate-spin" />
            ) : (
              <Upload className="h-6 w-6 text-primary-600" />
            )}
            <span className="text-xs font-semibold text-primary-800">
              {uploading ? "Uploading…" : "Tap to upload document"}
            </span>
            <span className="text-[10px] text-gray-400">Max 2 MB PDF · 8 MB images</span>
          </label>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8 text-gray-400 text-sm">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading documents…
        </div>
      ) : allDocuments.length === 0 ? (
        <div className="text-center py-8 rounded-xl bg-gray-50 border border-gray-100">
          <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No documents uploaded yet.</p>
          {!readOnly && (
            <p className="text-xs text-gray-400 mt-1">
              Upload parent CNIC, student B-Form, and other admission records.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ group, items }) =>
            items.length === 0 ? null : (
              <div key={group}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                  {group}
                </p>
                <div className="space-y-2">
                  {items.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:border-primary-100 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                        {isImageMime(doc.mimeType) ? (
                          <ImageIcon className="h-5 w-5 text-primary-600" />
                        ) : (
                          <FileText className="h-5 w-5 text-primary-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {documentDisplayName(doc.category, doc.label)}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {doc.fileName} · {formatFileSize(doc.fileSize)}
                          {doc.isPending ? " · unsaved" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => openPreview(doc)}
                          className="p-2 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => removeDocument(doc)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setPreview(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90dvh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{preview.title}</h3>
                <p className="text-[10px] text-gray-400 truncate">{preview.fileName}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="btn-ghost text-xs py-1.5 px-3"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-50">
              {isImageMime(preview.mimeType) ? (
                <img
                  src={preview.fileData}
                  alt={preview.title}
                  className="max-w-full h-auto mx-auto rounded-lg shadow-sm"
                />
              ) : (
                <iframe
                  src={preview.fileData}
                  title={preview.title}
                  className="w-full h-[70dvh] rounded-lg bg-white border border-gray-200"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
