import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth-util";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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
        subscriptionExpiresAt: true,
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
    const body = await req.json();
    const { disabled, role, subscriptionExpiresAt } = body;

    // Prevent admin from disabling themselves
    if (id === session?.user?.id && disabled === true) {
      return NextResponse.json(
        { error: "Cannot disable your own account" },
        { status: 400 }
      );
    }

    // Prevent admin from demoting themselves
    if (id === session?.user?.id && role !== undefined && role !== "admin") {
      return NextResponse.json(
        { error: "Cannot demote your own admin account" },
        { status: 400 }
      );
    }

    const updateData: Prisma.UserUpdateInput = {};
    if (disabled !== undefined) updateData.disabled = disabled;
    if (role !== undefined) updateData.role = role;
    if (subscriptionExpiresAt !== undefined) {
      updateData.subscriptionExpiresAt = subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Admin toggle error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}