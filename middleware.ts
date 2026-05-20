import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export const middleware = auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/chat/:path*",
    "/admin/:path*",
    "/suspended",    
  ],
};