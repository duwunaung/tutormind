import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Session } from "next-auth";

export interface AuthenticatedSession extends Session {
  user: {
    id: string;
    email: string;
    name: string;
    subject?: string;
    gradeLevel?: string;
    role?: string;
    disabled?: boolean;
  };
}

export type VerifyUserResult =
  | {
      errorResponse: null;
      session: AuthenticatedSession;
      user: {
        disabled: boolean;
        role: string;
        subscriptionExpiresAt: Date | null;
      };
    }
  | {
      errorResponse: NextResponse;
      session: null;
      user: null;
    };

export type VerifyAdminResult = VerifyUserResult;

export async function verifyUser(): Promise<VerifyUserResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
      user: null,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { disabled: true, role: true, subscriptionExpiresAt: true },
  });

  if (!user || user.disabled) {
    return {
      errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
      user: null,
    };
  }

  // Check subscription expiry for standard users
  if (user.role !== "admin") {
    const isExpired = user.subscriptionExpiresAt
      ? new Date() > new Date(user.subscriptionExpiresAt)
      : true;

    if (isExpired) {
      return {
        errorResponse: NextResponse.json({ error: "Subscription expired" }, { status: 403 }),
        session: null,
        user: null,
      };
    }
  }

  return {
    errorResponse: null,
    session: session as AuthenticatedSession,
    user,
  };
}

export async function verifyAdmin(): Promise<VerifyAdminResult> {
  const result = await verifyUser();
  if (result.errorResponse) {
    return { errorResponse: result.errorResponse, session: null, user: null };
  }

  if (result.user.role !== "admin") {
    return {
      errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      session: null,
      user: null,
    };
  }

  return result;
}

