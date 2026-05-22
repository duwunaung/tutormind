import type { NextAuthConfig } from "next-auth";

// Edge-safe auth config — NO imports of prisma, bcrypt, or any Node.js modules.
// Used only by proxy.ts (middleware) for session/JWT checks.
export const authConfig: NextAuthConfig = {
  providers: [], // providers with DB access are in auth.ts only
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const user = auth?.user as { role?: string; disabled?: boolean } | undefined;
      const isLoggedIn = !!user;
      const isAdmin = user?.role === "admin";
      const isDisabled = user?.disabled === true;

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
        nextUrl.pathname.startsWith("/chat") ||
        nextUrl.pathname.startsWith("/new-plan") ||
        nextUrl.pathname.startsWith("/lesson-plan");

      if (isProtected) {
        if (!isLoggedIn) return Response.redirect(new URL("/login", nextUrl));
        if (isAdmin) return Response.redirect(new URL("/admin", nextUrl));
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        const u = user as { id?: string; subject?: string; gradeLevel?: string; role?: string; disabled?: boolean };
        token.id = u.id;
        token.subject = u.subject;
        token.gradeLevel = u.gradeLevel;
        token.role = u.role;
        token.disabled = u.disabled;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        const u = session.user as { id?: string; subject?: string; gradeLevel?: string; role?: string; disabled?: boolean };
        u.id = token.id as string;
        u.subject = token.subject as string;
        u.gradeLevel = token.gradeLevel as string;
        u.role = token.role as string;
        u.disabled = token.disabled as boolean;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
};