import { Role } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      department?: string | null;
      jobTitle?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    department?: string | null;
    jobTitle?: string | null;
  }
}
