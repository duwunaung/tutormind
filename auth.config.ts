import type { NextAuthConfig } from "next-auth";

// Edge-safe auth config — NO imports of prisma, bcrypt, or any Node.js modules.
// Used only by proxy.ts (middleware) for session/JWT checks.
export const authConfig: NextAuthConfig = {
  providers: [], // providers with DB access are in auth.ts only
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = (auth?.user as any)?.role === "admin";
      const isDisabled = (auth?.user as any)?.disabled === true;

      // Redirect disabled users
      if (isLoggedIn && isDisabled && nextUrl.pathname !== "/suspended") {
        return Response.redirect(new URL("/suspended", nextUrl));
      }

      // Protect admin routes
      if (nextUrl.pathname.startsWith("/admin")) {
        if (!isLoggedIn) return Response.redirect(new URL("/login", nextUrl));
        if (!isAdmin) return Response.redirect(new URL("/dashboard", nextUrl));
        return true;
      }

      // Protect app routes
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
        token.role = (user as any).role;         // ← add
        token.disabled = (user as any).disabled; // ← add
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).subject = token.subject;
        (session.user as any).gradeLevel = token.gradeLevel;
        (session.user as any).role = token.role;         // ← add
        (session.user as any).disabled = token.disabled; // ← add
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
};