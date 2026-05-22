import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validate shape and format before touching the DB
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          subject: user.subject,
          gradeLevel: user.gradeLevel,          
          role: user.role,          
          disabled: user.disabled,
          subscriptionExpiresAt: user.subscriptionExpiresAt ? user.subscriptionExpiresAt.toISOString() : null,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        const u = user as { id?: string; subject?: string; gradeLevel?: string; role?: string; disabled?: boolean; subscriptionExpiresAt?: Date | string | null };
        token.id = u.id;
        token.subject = u.subject;
        token.gradeLevel = u.gradeLevel;
        token.role = u.role;
        token.disabled = u.disabled;
        token.subscriptionExpiresAt = u.subscriptionExpiresAt
          ? (u.subscriptionExpiresAt instanceof Date ? u.subscriptionExpiresAt.toISOString() : u.subscriptionExpiresAt)
          : null;
      } else if (token.id && typeof token.id === "string") {
        try {
          const latest = await prisma.user.findUnique({
            where: { id: token.id },
            select: { disabled: true, role: true, subscriptionExpiresAt: true },
          });
          if (latest) {
            token.disabled = latest.disabled;
            token.role = latest.role;
            token.subscriptionExpiresAt = latest.subscriptionExpiresAt
              ? latest.subscriptionExpiresAt.toISOString()
              : null;
          }
        } catch (e) {
          console.error("JWT sync error:", e);
        }
      }
      return token;
    },
  },
  events: {
    async signIn({ user }) {
      if (user?.id) {
        try {
          await prisma.auditLog.create({
            data: {
              action: "USER_LOGIN",
              actorId: user.id,
              actorEmail: user.email || "unknown",
              actorName: user.name || "unknown",
              targetId: user.id,
              targetName: user.email || "unknown",
              details: { role: (user as { role?: string }).role || "user" },
            },
          });
        } catch (e) {
          console.error("Sign-in audit log error:", e);
        }
      }
    },
  },
});