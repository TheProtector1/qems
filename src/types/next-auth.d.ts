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
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    instituteId: string | null;
    instituteSlug: string | null;
    instituteName: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    instituteId: string | null;
    instituteSlug: string | null;
    instituteName: string | null;
  }
}
