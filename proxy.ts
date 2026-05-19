import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Use Edge-safe authConfig only — no DB, no Node.js modules
const { auth } = NextAuth(authConfig);

export const proxy = auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/chat/:path*",
    "/api/chat/:path*",
    "/api/lesson-plan/:path*",
    "/api/sessions/:path*",
    "/api/export/:path*",
    "/api/dashboard/:path*",
  ],
};