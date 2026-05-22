import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth-util";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createAuditLog } from "@/lib/audit-logger";

export async function GET(req: Request) {
  try {
    const { errorResponse } = await verifyAdmin();
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
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
          _count: {
            select: {
              sessions: true,
              lessonPlans: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      users,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { errorResponse, session } = await verifyAdmin();
    if (errorResponse || !session) return errorResponse || NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, email, password, role, subject, gradeLevel, subscriptionExpiresAt } = body;

    if (!name || !email || !password || !role || !subject || !gradeLevel) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    if (role !== "user" && role !== "admin") {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role,
        subject,
        gradeLevel,
        subscriptionExpiresAt: role === "user"
          ? (subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null)
          : null,
      },
    });

    await createAuditLog({
      action: "USER_CREATE",
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorName: session.user.name,
      targetId: user.id,
      targetName: user.email,
      details: {
        role: user.role,
        name: user.name,
        subject: user.subject,
        gradeLevel: user.gradeLevel,
        subscriptionExpiresAt: user.subscriptionExpiresAt ? user.subscriptionExpiresAt.toISOString() : null,
      },
    });

    return NextResponse.json(
      { message: "Account created", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin user creation error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}