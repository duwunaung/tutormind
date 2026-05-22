/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/register/route';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
  },
}));

describe('Register API Route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return 400 if required fields are missing', async () => {
    const req = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com' }),
    });

    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe('All fields are required');
  });

  it('should return 400 if password is less than 8 characters', async () => {
    const req = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test',
        email: 'test@test.com',
        password: 'short',
        subject: 'Math',
        gradeLevel: 'Grade 5',
      }),
    });

    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe('Password must be at least 8 characters long');
  });

  it('should return 400 if email is already registered', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: '1' } as any);

    const req = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test',
        email: 'test@test.com',
        password: 'password123',
        subject: 'Math',
        gradeLevel: 'Grade 5',
      }),
    });

    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe('Email already registered');
  });

  it('should return 201 and create user on success', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
    vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed_password' as never);
    vi.mocked(prisma.user.create).mockResolvedValueOnce({ id: 'new-user-id' } as any);

    const req = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test',
        email: 'test@test.com',
        password: 'password123',
        subject: 'Math',
        gradeLevel: 'Grade 5',
      }),
    });

    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.message).toBe('Account created');
    expect(data.userId).toBe('new-user-id');
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: 'Test',
        email: 'test@test.com',
        password: 'hashed_password',
        subject: 'Math',
        gradeLevel: 'Grade 5',
        subscriptionExpiresAt: expect.any(Date),
      },
    });
  });

  it('should return 500 if an exception is thrown', async () => {
    vi.mocked(prisma.user.findUnique).mockRejectedValueOnce(new Error('DB connection failed'));

    const req = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test',
        email: 'test@test.com',
        password: 'password123',
        subject: 'Math',
        gradeLevel: 'Grade 5',
      }),
    });

    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(500);
    expect(data.error).toBe('Something went wrong');
  });
});
