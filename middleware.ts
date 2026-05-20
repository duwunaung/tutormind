import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export const middleware = auth;  // ← must be named "middleware"

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/chat/:path*",
    // no /api/* routes
  ],
};