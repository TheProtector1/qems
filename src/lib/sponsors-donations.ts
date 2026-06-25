export const SPONSOR_TYPES = [
  { value: "INDIVIDUAL", label: "Individual", icon: "👤" },
  { value: "ORGANIZATION", label: "Organization", icon: "🏛️" },
  { value: "CORPORATE", label: "Corporate", icon: "🏢" },
  { value: "ANONYMOUS", label: "Anonymous", icon: "🎭" },
] as const;

export const DONATION_FREQUENCIES = [
  { value: "ONE_TIME", label: "One-time" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "YEARLY", label: "Yearly" },
  { value: "CUSTOM", label: "Custom / Other" },
] as const;

export const DONATION_CATEGORIES = [
  { value: "GENERAL", label: "General Fund", color: "bg-gray-100 text-gray-700" },
  { value: "SCHOLARSHIP", label: "Scholarship", color: "bg-purple-100 text-purple-700" },
  { value: "BUILDING", label: "Building / Infrastructure", color: "bg-amber-100 text-amber-800" },
  { value: "OPERATIONS", label: "Operations", color: "bg-blue-100 text-blue-700" },
  { value: "RAMADAN", label: "Ramadan", color: "bg-emerald-100 text-emerald-700" },
  { value: "ZAKAT", label: "Zakat", color: "bg-green-100 text-green-800" },
  { value: "SADAQAH", label: "Sadaqah", color: "bg-teal-100 text-teal-700" },
  { value: "OTHER", label: "Other", color: "bg-slate-100 text-slate-700" },
] as const;

export const DONATION_STATUSES = [
  { value: "RECEIVED", label: "Received", pill: "pill-success" },
  { value: "PLEDGED", label: "Pledged", pill: "pill-info" },
  { value: "PARTIAL", label: "Partial", pill: "pill-warning" },
  { value: "CANCELLED", label: "Cancelled", pill: "bg-gray-100 text-gray-500" },
] as const;

export const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "JAZZCASH", label: "JazzCash" },
  { value: "EASYPAISA", label: "EasyPaisa" },
  { value: "STRIPE", label: "Stripe / Card" },
  { value: "OTHER", label: "Other" },
] as const;

export function getSponsorTypeLabel(value: string) {
  return SPONSOR_TYPES.find((t) => t.value === value)?.label || value;
}

export function getFrequencyLabel(value: string) {
  return DONATION_FREQUENCIES.find((f) => f.value === value)?.label || value;
}

export function getCategoryMeta(value: string) {
  return DONATION_CATEGORIES.find((c) => c.value === value) || DONATION_CATEGORIES[0];
}

export function getStatusMeta(value: string) {
  return DONATION_STATUSES.find((s) => s.value === value) || DONATION_STATUSES[0];
}

export function periodMonthFromDate(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
