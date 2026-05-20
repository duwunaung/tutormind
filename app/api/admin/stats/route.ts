import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersThisWeek,
      totalSessions,
      totalPlans,
      newSessionsThisWeek,
      subjectCounts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.session.count(),
      prisma.lessonPlan.count(),
      prisma.session.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.session.groupBy({
        by: ["subject"],
        _count: { subject: true },
        orderBy: { _count: { subject: "desc" } },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      newUsersThisWeek,
      totalSessions,
      totalPlans,
      newSessionsThisWeek,
      topSubjects: subjectCounts.map((s) => ({
        subject: s.subject,
        count: s._count.subject,
      })),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}