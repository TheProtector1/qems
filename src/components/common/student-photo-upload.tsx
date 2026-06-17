"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { compressImageFile } from "@/lib/image";
import { StudentAvatar } from "@/components/common/student-avatar";

type StudentPhotoUploadProps = {
  name: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | string;
  value?: string | null;
  onChange: (photo: string | null) => void;
  className?: string;
};

export function StudentPhotoUpload({
  name,
  gender = "MALE",
  value,
  onChange,
  className,
}: StudentPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const compressed = await compressImageFile(file);
      onChange(compressed);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload photo.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-xs font-semibold text-gray-700">Profile Photo</label>
      <div className="flex items-center gap-4">
        <div className="relative">
          <StudentAvatar name={name || "Student"} gender={gender} photo={value} size="lg" />
          {loading && (
            <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="btn-ghost text-xs py-2 w-fit"
          >
            <Camera className="h-4 w-4" />
            {value ? "Change Photo" : "Upload Photo"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              disabled={loading}
              className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" /> Remove
            </button>
          )}
          <p className="text-[10px] text-gray-400">JPG, PNG or WebP. Max 5 MB.</p>
        </div>
      </div>
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}
