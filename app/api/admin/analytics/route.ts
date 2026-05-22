import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth-util";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { errorResponse } = await verifyAdmin();
    if (errorResponse) return errorResponse;

    // Fetch totals for KPIs
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalSessions,
      totalPlans,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { disabled: false } }),
      prisma.user.count({ where: { disabled: true } }),
      prisma.session.count(),
      prisma.lessonPlan.count(),
    ]);

    // Fetch user registrations and sessions from the last 7 days (start of day, timezone safe)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [recentUsers, recentSessions] = await Promise.all([
      prisma.user.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      }),
      prisma.session.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      }),
    ]);

    // Construct 7-day list
    const activity = Array.from({ length: 7 }).map((_, i) => {
      const dateObj = new Date();
      dateObj.setDate(dateObj.getDate() - (6 - i));
      const dateString = dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      const dayStart = new Date(dateObj);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dateObj);
      dayEnd.setHours(23, 59, 59, 999);

      const userCount = recentUsers.filter((u) => {
        const t = new Date(u.createdAt).getTime();
        return t >= dayStart.getTime() && t <= dayEnd.getTime();
      }).length;

      const sessionCount = recentSessions.filter((s) => {
        const t = new Date(s.createdAt).getTime();
        return t >= dayStart.getTime() && t <= dayEnd.getTime();
      }).length;

      return {
        date: dateString,
        users: userCount,
        sessions: sessionCount,
      };
    });

    // Subject breakdown (from sessions)
    const subjectCounts = await prisma.session.groupBy({
      by: ["subject"],
      _count: { subject: true },
      orderBy: { _count: { subject: "desc" } },
    });

    const subjects = subjectCounts.map((s) => ({
      name: s.subject,
      count: s._count.subject,
    }));

    // Grade level breakdown (from users)
    const gradeCounts = await prisma.user.groupBy({
      by: ["gradeLevel"],
      _count: { gradeLevel: true },
      orderBy: { _count: { gradeLevel: "desc" } },
    });

    const grades = gradeCounts.map((g) => ({
      name: g.gradeLevel,
      count: g._count.gradeLevel,
    }));

    return NextResponse.json({
      kpis: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        totalSessions,
        totalPlans,
      },
      activity,
      subjects,
      grades,
    });
  } catch (error) {
    console.error("Usage analytics API error:", error);
    return NextResponse.json({ error: "Failed to load usage analytics" }, { status: 500 });
  }
}
