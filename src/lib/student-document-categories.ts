export const STUDENT_DOCUMENT_GROUPS = [
  "Parent / Guardian ID",
  "Student Identity",
  "Academic Records",
  "Medical",
  "Other",
] as const;

export type StudentDocumentGroup = (typeof STUDENT_DOCUMENT_GROUPS)[number];

export const STUDENT_DOCUMENT_CATEGORIES = [
  {
    value: "PARENT_CNIC_FRONT",
    label: "Father / Guardian CNIC — Front",
    group: "Parent / Guardian ID" as StudentDocumentGroup,
    hint: "Clear photo of the front side of CNIC or NICOP",
  },
  {
    value: "PARENT_CNIC_BACK",
    label: "Father / Guardian CNIC — Back",
    group: "Parent / Guardian ID" as StudentDocumentGroup,
    hint: "Clear photo of the back side of CNIC or NICOP",
  },
  {
    value: "MOTHER_CNIC_FRONT",
    label: "Mother CNIC — Front",
    group: "Parent / Guardian ID" as StudentDocumentGroup,
  },
  {
    value: "MOTHER_CNIC_BACK",
    label: "Mother CNIC — Back",
    group: "Parent / Guardian ID" as StudentDocumentGroup,
  },
  {
    value: "GUARDIAN_CNIC_FRONT",
    label: "Guardian CNIC — Front",
    group: "Parent / Guardian ID" as StudentDocumentGroup,
  },
  {
    value: "GUARDIAN_CNIC_BACK",
    label: "Guardian CNIC — Back",
    group: "Parent / Guardian ID" as StudentDocumentGroup,
  },
  {
    value: "STUDENT_BFORM",
    label: "Student B-Form / Birth Certificate",
    group: "Student Identity" as StudentDocumentGroup,
    hint: "NADRA B-Form, birth certificate, or registration slip",
  },
  {
    value: "STUDENT_CNIC",
    label: "Student CNIC / Child Registration",
    group: "Student Identity" as StudentDocumentGroup,
  },
  {
    value: "STUDENT_PASSPORT",
    label: "Student Passport",
    group: "Student Identity" as StudentDocumentGroup,
  },
  {
    value: "PREVIOUS_CERTIFICATE",
    label: "Previous Madrasa / School Certificate",
    group: "Academic Records" as StudentDocumentGroup,
  },
  {
    value: "TRANSFER_LETTER",
    label: "Transfer / Leaving Certificate",
    group: "Academic Records" as StudentDocumentGroup,
  },
  {
    value: "MEDICAL_REPORT",
    label: "Medical Report",
    group: "Medical" as StudentDocumentGroup,
  },
  {
    value: "VACCINATION_RECORD",
    label: "Vaccination / Immunization Record",
    group: "Medical" as StudentDocumentGroup,
  },
  {
    value: "OTHER",
    label: "Other Document",
    group: "Other" as StudentDocumentGroup,
    requiresLabel: true,
  },
] as const;

export type StudentDocumentCategoryValue =
  (typeof STUDENT_DOCUMENT_CATEGORIES)[number]["value"];

export function getDocumentCategoryMeta(value: string) {
  return (
    STUDENT_DOCUMENT_CATEGORIES.find((c) => c.value === value) ||
    STUDENT_DOCUMENT_CATEGORIES[STUDENT_DOCUMENT_CATEGORIES.length - 1]
  );
}

export function documentDisplayName(category: string, label?: string | null) {
  const meta = getDocumentCategoryMeta(category);
  if (category === "OTHER" && label?.trim()) return label.trim();
  return meta.label;
}
