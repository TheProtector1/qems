"use client";

import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, toggleLocale, t } = useI18n();

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors",
        className
      )}
      title={t.common.language}
      aria-label={t.common.language}
    >
      <Languages className="h-3.5 w-3.5 text-primary-700" />
      <span>{locale === "en" ? "اردو" : "EN"}</span>
    </button>
  );
}
