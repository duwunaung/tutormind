import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id?: string;
    subject?: string;
    gradeLevel?: string;
    role?: string;
    disabled?: boolean;
  }

  interface Session {
    user: {
      id: string;
      subject?: string;
      gradeLevel?: string;
      role?: string;
      disabled?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    subject?: string;
    gradeLevel?: string;
    role?: string;
    disabled?: boolean;
  }
}