/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/lesson-plan/route";
import { prisma } from "@/lib/prisma";
import { verifyUser } from "@/lib/auth-util";
import { groq } from "@/lib/ai";
import { NextResponse } from "next/server";

vi.mock("@/lib/auth-util", () => ({
  verifyUser: vi.fn(),
}));

vi.mock("@/lib/ai", () => ({
  groq: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    session: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    lessonPlan: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("Lesson Plan POST API Route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return error response if user session is invalid", async () => {
    vi.mocked(verifyUser).mockResolvedValueOnce({
      errorResponse: new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
      session: null,
    } as any);

    const req = new Request("http://localhost/api/lesson-plan", {
      method: "POST",
      body: JSON.stringify({ sessionId: "session-1" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return existing plan if already generated", async () => {
    vi.mocked(verifyUser).mockResolvedValueOnce({
      errorResponse: null,
      session: { user: { id: "user-1" } },
    } as any);

    const mockPlan = {
      id: "plan-1",
      userId: "user-1",
      sessionId: "session-1",
      structure: { title: "Existing Plan" },
    };

    vi.mocked(prisma.lessonPlan.findUnique).mockResolvedValueOnce(mockPlan as any);

    const req = new Request("http://localhost/api/lesson-plan", {
      method: "POST",
      body: JSON.stringify({ sessionId: "session-1" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.lessonPlan).toEqual(mockPlan);
  });

  it("should return 404 if session not found", async () => {
    vi.mocked(verifyUser).mockResolvedValueOnce({
      errorResponse: null,
      session: { user: { id: "user-1" } },
    } as any);

    vi.mocked(prisma.lessonPlan.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.session.findUnique).mockResolvedValueOnce(null);

    const req = new Request("http://localhost/api/lesson-plan", {
      method: "POST",
      body: JSON.stringify({ sessionId: "session-not-found" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Session not found");
  });

  it("should return 400 if session is a chat flow and is not ready", async () => {
    vi.mocked(verifyUser).mockResolvedValueOnce({
      errorResponse: null,
      session: { user: { id: "user-1" } },
    } as any);

    vi.mocked(prisma.lessonPlan.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.session.findUnique).mockResolvedValueOnce({
      id: "session-1",
      userId: "user-1",
      messages: [
        { role: "assistant", content: "Welcome! Tell me about the plan." },
        { role: "user", content: "I want a math plan" },
      ],
    } as any);

    const req = new Request("http://localhost/api/lesson-plan", {
      method: "POST",
      body: JSON.stringify({ sessionId: "session-1" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("Session is not ready for generation");
  });

  it("should generate successfully if session is a wizard flow", async () => {
    vi.mocked(verifyUser).mockResolvedValueOnce({
      errorResponse: null,
      session: { user: { id: "user-1" } },
    } as any);

    vi.mocked(prisma.lessonPlan.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.session.findUnique).mockResolvedValueOnce({
      id: "session-1",
      userId: "user-1",
      subject: "Math",
      messages: [
        { role: "user", content: "Create a math lesson plan" },
      ],
    } as any);

    const mockGroqResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              type: "lesson",
              title: "Generated Title",
              subject: "Math",
              gradeLevel: "Grade 6",
            }),
          },
        },
      ],
    };

    vi.mocked(groq.chat.completions.create).mockResolvedValueOnce(mockGroqResponse as any);

    const mockNewPlan = {
      id: "plan-new",
      userId: "user-1",
      structure: { title: "Generated Title" },
    };

    vi.mocked(prisma.$transaction).mockResolvedValueOnce([mockNewPlan, {}] as any);

    const req = new Request("http://localhost/api/lesson-plan", {
      method: "POST",
      body: JSON.stringify({ sessionId: "session-1" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.lessonPlan).toEqual(mockNewPlan);
  });

  it("should generate successfully if session is a ready chat flow", async () => {
    vi.mocked(verifyUser).mockResolvedValueOnce({
      errorResponse: null,
      session: { user: { id: "user-1" } },
    } as any);

    vi.mocked(prisma.lessonPlan.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.session.findUnique).mockResolvedValueOnce({
      id: "session-1",
      userId: "user-1",
      subject: "Math",
      messages: [
        { role: "assistant", content: "Welcome! Tell me about the plan." },
        { role: "user", content: "I want a math plan" },
        { role: "assistant", content: "Everything is set!", ready: true },
      ],
    } as any);

    const mockGroqResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              type: "lesson",
              title: "Generated Title",
              subject: "Math",
              gradeLevel: "Grade 6",
            }),
          },
        },
      ],
    };

    vi.mocked(groq.chat.completions.create).mockResolvedValueOnce(mockGroqResponse as any);

    const mockNewPlan = {
      id: "plan-new",
      userId: "user-1",
      structure: { title: "Generated Title" },
    };

    vi.mocked(prisma.$transaction).mockResolvedValueOnce([mockNewPlan, {}] as any);

    const req = new Request("http://localhost/api/lesson-plan", {
      method: "POST",
      body: JSON.stringify({ sessionId: "session-1" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.lessonPlan).toEqual(mockNewPlan);
  });
});
