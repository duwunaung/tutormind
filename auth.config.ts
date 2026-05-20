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
        nextUrl.pathname.startsWith("/chat");

      if (isProtected && !isLoggedIn) {
        return Response.redirect(new URL("/login", nextUrl));
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.subject = (user as any).subject;
        token.gradeLevel = (user as any).gradeLevel;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).subject = token.subject;
        (session.user as any).gradeLevel = token.gradeLevel;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
};