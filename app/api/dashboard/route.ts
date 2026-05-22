import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/auth-util";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const authResult = await verifyUser();
    if (authResult.errorResponse) return authResult.errorResponse;
    const { session } = authResult;

    const sessions = await prisma.session.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { lessonPlan: true },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to load sessions" },
      { status: 500 }
    );
  }
}