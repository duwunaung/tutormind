import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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