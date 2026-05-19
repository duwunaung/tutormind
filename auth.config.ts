import type { NextAuthConfig } from "next-auth";

// Edge-safe auth config — NO imports of prisma, bcrypt, or any Node.js modules.
// Used only by proxy.ts (middleware) for session/JWT checks.
export const authConfig: NextAuthConfig = {
  providers: [], // providers with DB access are in auth.ts only
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/chat") ||
        nextUrl.pathname.startsWith("/api/chat") ||
        nextUrl.pathname.startsWith("/api/lesson-plan") ||
        nextUrl.pathname.startsWith("/api/sessions") ||
        nextUrl.pathname.startsWith("/api/export") ||
        nextUrl.pathname.startsWith("/api/dashboard");

      if (isProtected && !isLoggedIn) {
        return Response.redirect(new URL("/login", nextUrl));
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) session.user.id = token.id as string;
      return session;
    },
  },
  pages: { signIn: "/login" },
};