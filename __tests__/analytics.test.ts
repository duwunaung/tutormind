/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/admin/analytics/route';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/auth-util';
import { NextResponse } from 'next/server';

vi.mock('@/lib/auth-util', () => ({
  verifyAdmin: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    session: {
      count: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    lessonPlan: {
      count: vi.fn(),
    },
  },
}));

describe('Analytics API Route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return error response if user is not admin', async () => {
    vi.mocked(verifyAdmin).mockResolvedValueOnce({
      errorResponse: new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
      session: null,
      user: null,
    });

    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should compute and return analytics successfully for admin', async () => {
    vi.mocked(verifyAdmin).mockResolvedValueOnce({
      errorResponse: null,
      session: { user: { id: 'admin-1' } } as any,
      user: { id: 'admin-1', role: 'admin' } as any,
    });

    // Mock count calls
    vi.mocked(prisma.user.count)
      .mockResolvedValueOnce(50)  // totalUsers
      .mockResolvedValueOnce(45)  // activeUsers
      .mockResolvedValueOnce(5);  // suspendedUsers

    vi.mocked(prisma.session.count).mockResolvedValueOnce(120);
    vi.mocked(prisma.lessonPlan.count).mockResolvedValueOnce(80);

    // Mock recent users and sessions
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce([
      { createdAt: now },
      { createdAt: threeDaysAgo },
    ] as any);

    vi.mocked(prisma.session.findMany).mockResolvedValueOnce([
      { createdAt: now },
      { createdAt: now },
    ] as any);

    // Mock groupBy
    vi.mocked(prisma.session.groupBy).mockResolvedValueOnce([
      { subject: 'Math', _count: { subject: 10 } },
      { subject: 'Science', _count: { subject: 5 } },
    ] as any);

    vi.mocked(prisma.user.groupBy).mockResolvedValueOnce([
      { gradeLevel: 'High School (9-12)', _count: { gradeLevel: 15 } },
      { gradeLevel: 'College / Adult', _count: { gradeLevel: 30 } },
    ] as any);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.kpis).toEqual({
      totalUsers: 50,
      activeUsers: 45,
      suspendedUsers: 5,
      totalSessions: 120,
      totalPlans: 80,
    });

    expect(data.activity).toHaveLength(7);
    // Find today's entry
    const todayStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const todayActivity = data.activity.find((a: any) => a.date === todayStr);
    expect(todayActivity).toBeDefined();
    expect(todayActivity.users).toBe(1);
    expect(todayActivity.sessions).toBe(2);

    expect(data.subjects).toEqual([
      { name: 'Math', count: 10 },
      { name: 'Science', count: 5 },
    ]);

    expect(data.grades).toEqual([
      { name: 'High School (9-12)', count: 15 },
      { name: 'College / Adult', count: 30 },
    ]);
  });

  it('should return 500 error if query fails', async () => {
    vi.mocked(verifyAdmin).mockResolvedValueOnce({
      errorResponse: null,
      session: { user: { id: 'admin-1' } } as any,
      user: { id: 'admin-1', role: 'admin' } as any,
    });

    vi.mocked(prisma.user.count).mockRejectedValueOnce(new Error('Prisma error'));

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Failed to load usage analytics');
  });
});
