import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth-util";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { errorResponse } = await verifyAdmin();
    if (errorResponse) return errorResponse;

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        subject: true,
        gradeLevel: true,
        role: true,
        disabled: true,
        createdAt: true,
        _count: {
          select: {
            sessions: true,
            lessonPlans: true,
          },
        },
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}