/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyUser, verifyAdmin } from '@/lib/auth-util';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Mock dependencies
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Auth Utility (auth-util)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('verifyUser', () => {
    it('should return unauthorized response if session or user ID is missing', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null);

      const result = await verifyUser();
      expect(result.errorResponse).toBeInstanceOf(NextResponse);
      expect(result.errorResponse?.status).toBe(401);
      expect(result.session).toBeNull();
    });

    it('should return unauthorized response if user is not in database', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user-1', email: 'test@test.com' } });
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

      const result = await verifyUser();
      expect(result.errorResponse?.status).toBe(401);
      expect(result.session).toBeNull();
    });

    it('should return unauthorized response if user is disabled', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user-1', email: 'test@test.com' } });
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ disabled: true, role: 'user' } as any);

      const result = await verifyUser();
      expect(result.errorResponse?.status).toBe(401);
      expect(result.session).toBeNull();
    });

    it('should return session and user details if authenticated and active', async () => {
      const mockSession = { user: { id: 'user-1', email: 'test@test.com' } };
      vi.mocked(auth).mockResolvedValueOnce(mockSession);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ disabled: false, role: 'user' } as any);

      const result = await verifyUser();
      expect(result.errorResponse).toBeNull();
      expect(result.session).toEqual(mockSession);
      expect(result.user).toEqual({ disabled: false, role: 'user' });
    });
  });

  describe('verifyAdmin', () => {
    it('should return unauthorized if user verification fails', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null);

      const result = await verifyAdmin();
      expect(result.errorResponse?.status).toBe(401);
    });

    it('should return forbidden if user is not an admin', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user-1' } });
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ disabled: false, role: 'user' } as any);

      const result = await verifyAdmin();
      expect(result.errorResponse?.status).toBe(403);
    });

    it('should pass if user is an admin', async () => {
      const mockSession = { user: { id: 'admin-1' } };
      vi.mocked(auth).mockResolvedValueOnce(mockSession);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ disabled: false, role: 'admin' } as any);

      const result = await verifyAdmin();
      expect(result.errorResponse).toBeNull();
      expect(result.user?.role).toBe('admin');
    });
  });
});
