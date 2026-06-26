/** Normalize phone to digits only for lookup and storage. */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Placeholder email for parent accounts when no email is provided. */
export function parentLoginEmail(phone: string, optionalEmail?: string | null): string {
  if (optionalEmail?.trim()) return optionalEmail.trim().toLowerCase();
  const digits = normalizePhone(phone);
  return `p.${digits}@parent.qems.local`;
}

export function isParentPlaceholderEmail(email: string): boolean {
  return email.endsWith("@parent.qems.local");
}

export function looksLikeEmail(value: string): boolean {
  return value.includes("@");
}
