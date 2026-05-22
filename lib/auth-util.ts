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
    select: { disabled: true, role: true },
  });

  if (!user || user.disabled) {
    return {
      errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
      user: null,
    };
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

