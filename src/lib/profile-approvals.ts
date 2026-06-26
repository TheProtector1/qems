import { Role } from "@prisma/client";

export type ProfileField = "name" | "email" | "phone";

export const APPROVAL_REQUIRED_FIELDS: ProfileField[] = ["name", "email", "phone"];

export type ApproverType = "INSTITUTE_OWNER" | "SUPER_ADMIN";

/** Who must approve profile detail changes for this role. */
export function getProfileApproverType(role: Role): ApproverType | null {
  switch (role) {
    case "PARENT":
    case "STUDENT":
    case "TEACHER":
    case "STAFF":
    case "BRANCH_MANAGER":
      return "INSTITUTE_OWNER";
    case "INSTITUTE_OWNER":
      return "SUPER_ADMIN";
    case "SUPER_ADMIN":
      return null;
    default:
      return "INSTITUTE_OWNER";
  }
}

export function canApproveProfileRequest(
  reviewerRole: Role,
  approverType: ApproverType
): boolean {
  if (approverType === "INSTITUTE_OWNER") {
    return reviewerRole === "INSTITUTE_OWNER" || reviewerRole === "SUPER_ADMIN";
  }
  return reviewerRole === "SUPER_ADMIN";
}

export function approverLabel(approverType: ApproverType): string {
  return approverType === "SUPER_ADMIN" ? "Super Admin" : "Institute Owner";
}
