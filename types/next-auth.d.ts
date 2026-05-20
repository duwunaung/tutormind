import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      subject?: string;
      gradeLevel?: string;
    } & DefaultSession["user"];
  }

  interface User {
    subject?: string;
    gradeLevel?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    subject?: string;
    gradeLevel?: string;
  }
}