import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth-util";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createAuditLog } from "@/lib/audit-logger";

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
    if (errorResponse || !session) return errorResponse || NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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

    // Logging changes
    if (disabled !== undefined && disabled !== targetUser.disabled) {
      await createAuditLog({
        action: disabled ? "USER_SUSPEND" : "USER_ACTIVATE",
        actorId: session.user.id,
        actorEmail: session.user.email,
        actorName: session.user.name,
        targetId: user.id,
        targetName: user.email,
        details: { disabled },
      });
    }

    if (role !== undefined && role !== targetUser.role) {
      await createAuditLog({
        action: "ROLE_CHANGE",
        actorId: session.user.id,
        actorEmail: session.user.email,
        actorName: session.user.name,
        targetId: user.id,
        targetName: user.email,
        details: { oldRole: targetUser.role, newRole: user.role },
      });
    }

    if (subscriptionExpiresAt !== undefined) {
      const oldExpiry = targetUser.subscriptionExpiresAt;
      const newExpiry = user.subscriptionExpiresAt;
      const oldTime = oldExpiry ? new Date(oldExpiry).getTime() : 0;
      const newTime = newExpiry ? new Date(newExpiry).getTime() : 0;

      if (oldTime !== newTime) {
        if (newExpiry === null) {
          await createAuditLog({
            action: "SUBSCRIPTION_REVOKE",
            actorId: session.user.id,
            actorEmail: session.user.email,
            actorName: session.user.name,
            targetId: user.id,
            targetName: user.email,
            details: { oldExpiry: oldExpiry ? oldExpiry.toISOString() : null },
          });
        } else {
          await createAuditLog({
            action: "SUBSCRIPTION_EXTEND",
            actorId: session.user.id,
            actorEmail: session.user.email,
            actorName: session.user.name,
            targetId: user.id,
            targetName: user.email,
            details: {
              oldExpiry: oldExpiry ? oldExpiry.toISOString() : null,
              newExpiry: newExpiry.toISOString(),
            },
          });
        }
      }
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Admin toggle error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}