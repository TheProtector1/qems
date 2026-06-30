import { DefaultSession } from "next-auth";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      instituteId: string | null;
      instituteSlug: string | null;
      instituteName: string | null;
      branchId: string | null;
      branchName: string | null;
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    instituteId: string | null;
    instituteSlug: string | null;
    instituteName: string | null;
    branchId: string | null;
    branchName: string | null;
    mustChangePassword?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    instituteId: string | null;
    instituteSlug: string | null;
    instituteName: string | null;
    branchId: string | null;
    branchName: string | null;
    mustChangePassword: boolean;
  }
}
