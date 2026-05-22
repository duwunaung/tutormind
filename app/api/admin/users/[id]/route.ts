import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth-util";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { errorResponse } = await verifyAdmin();
    if (errorResponse) return errorResponse;

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        subject: true,
        gradeLevel: true,
        role: true,
        disabled: true,
        createdAt: true,
        sessions: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            subject: true,
            planType: true,
            createdAt: true,
            lessonPlan: {
              select: { id: true },
            },
          },
        },
        _count: {
          select: {
            sessions: true,
            lessonPlans: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Admin user detail error:", error);
    return NextResponse.json({ error: "Failed to load user" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { errorResponse, session } = await verifyAdmin();
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const { disabled } = await req.json();

    // Prevent admin from disabling themselves
    if (id === session?.user?.id) {
      return NextResponse.json(
        { error: "Cannot disable your own account" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: { disabled },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Admin toggle error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}