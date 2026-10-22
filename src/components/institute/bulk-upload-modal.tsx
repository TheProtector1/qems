"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload, Download, X, FileSpreadsheet, CheckCircle,
  AlertTriangle, Loader2, Info, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ClassOption {
  id: string;
  name: string;
  programType: string;
}

export interface TeacherOption {
  id: string;
  name: string;
}

interface UploadResult {
  row: number;
  name: string;
  status: "success" | "failed";
  error?: string;
}

interface BulkUploadModalProps {
  classes: ClassOption[];
  teachers: TeacherOption[];
  onClose: () => void;
  onDone: () => void;
}

export function BulkUploadModal({ classes, teachers, onClose, onDone }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{
    total: number;
    successCount: number;
    failCount: number;
    rows: UploadResult[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (f: File) => {
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(f.type) && !f.name.match(/\.(xlsx|xls)$/i)) {
      setError("Please upload an Excel file (.xlsx or .xls)");
      return;
    }
    setFile(f);
    setError(null);
    setResults(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResults(null);

    try {
      const form = new FormData();
      form.append("file", file);
      if (selectedClassId) form.append("classId", selectedClassId);
      if (selectedTeacherId) form.append("teacherId", selectedTeacherId);

      const res = await fetch("/api/institute/students/bulk-upload", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setResults({
        total: data.total,
        successCount: data.successCount,
        failCount: data.failCount,
        rows: data.results || [],
      });

      if (data.successCount > 0) {
        onDone();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const downloadSample = () => {
    window.open("/api/institute/students/sample-sheet", "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!uploading ? onClose : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90dvh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold">Bulk Upload Students</h2>
              <p className="text-emerald-200 text-xs mt-0.5">Import multiple students from an Excel file</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Download sample */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-blue-800">Use the sample template</p>
              <p className="text-xs text-blue-600 mt-0.5">
                Download the sample sheet to see required column headings and example data.
              </p>
            </div>
            <button
              onClick={downloadSample}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-lg transition-colors shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              Sample Sheet
            </button>
          </div>

          {/* Class & Teacher assignment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Assign to Class <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="form-input text-xs"
                disabled={uploading}
              >
                <option value="">No class assignment</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.programType})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Assign Teacher <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="form-input text-xs"
                disabled={uploading}
              >
                <option value="">No teacher assignment</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Drop zone */}
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
              isDragging
                ? "border-emerald-400 bg-emerald-50"
                : file
                ? "border-emerald-300 bg-emerald-50/50"
                : "border-gray-200 hover:border-emerald-300 hover:bg-gray-50"
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet className="h-10 w-10 text-emerald-500" />
                <p className="font-semibold text-gray-800 text-sm">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); setResults(null); }}
                  className="text-xs text-red-500 hover:text-red-700 font-medium mt-1"
                  disabled={uploading}
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-10 w-10 text-gray-300" />
                <p className="font-semibold text-gray-600 text-sm">Drop Excel file here</p>
                <p className="text-xs text-gray-400">or click to browse (.xlsx, .xls)</p>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-semibold">{error}</p>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-3">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="font-display text-xl font-bold text-gray-800">{results.total}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Total Rows</p>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="font-display text-xl font-bold text-emerald-700">{results.successCount}</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">Imported</p>
                </div>
                <div className={cn("text-center p-3 rounded-xl border", results.failCount > 0 ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100")}>
                  <p className={cn("font-display text-xl font-bold", results.failCount > 0 ? "text-red-700" : "text-gray-400")}>{results.failCount}</p>
                  <p className={cn("text-[10px] mt-0.5", results.failCount > 0 ? "text-red-500" : "text-gray-400")}>Failed</p>
                </div>
              </div>

              {/* Row-level results */}
              {results.rows.length > 0 && (
                <div className="border border-gray-100 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 text-gray-500 font-semibold">Row</th>
                        <th className="text-left px-3 py-2 text-gray-500 font-semibold">Name</th>
                        <th className="text-left px-3 py-2 text-gray-500 font-semibold">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {results.rows.map((r) => (
                        <tr key={r.row} className={r.status === "failed" ? "bg-red-50" : ""}>
                          <td className="px-3 py-2 text-gray-400">{r.row}</td>
                          <td className="px-3 py-2 font-medium text-gray-700">{r.name}</td>
                          <td className="px-3 py-2">
                            {r.status === "success" ? (
                              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                                <CheckCircle className="h-3.5 w-3.5" /> Added
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-500 font-semibold">
                                <AlertTriangle className="h-3.5 w-3.5" /> {r.error || "Error"}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 shrink-0 flex items-center justify-between gap-3 bg-gray-50">
          <button onClick={onClose} disabled={uploading} className="btn-ghost text-sm py-2 px-4">
            {results ? "Close" : "Cancel"}
          </button>
          {!results && (
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className={cn(
                "btn-primary text-sm py-2 px-5 flex items-center gap-2",
                (!file || uploading) && "opacity-60 cursor-not-allowed"
              )}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing…
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  Import Students
                </>
              )}
            </button>
          )}
          {results && results.failCount > 0 && !results.successCount && (
            <button
              onClick={() => { setResults(null); setFile(null); }}
              className="btn-primary text-sm py-2 px-4"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
