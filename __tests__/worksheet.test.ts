/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/lesson-plan/[id]/worksheet/route";
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
    lessonPlan: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/audit-logger", () => ({
  createAuditLog: vi.fn(),
}));

describe("Worksheet Generation API Route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return error response if user session is invalid", async () => {
    vi.mocked(verifyUser).mockResolvedValueOnce({
      errorResponse: new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
      session: null,
    } as any);

    const req = new Request("http://localhost/api/lesson-plan/plan-1/worksheet", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: "plan-1" }) });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 404 if lesson plan not found", async () => {
    vi.mocked(verifyUser).mockResolvedValueOnce({
      errorResponse: null,
      session: { user: { id: "user-1" } },
    } as any);

    vi.mocked(prisma.lessonPlan.findUnique).mockResolvedValueOnce(null);

    const req = new Request("http://localhost/api/lesson-plan/plan-not-found/worksheet", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: "plan-not-found" }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Lesson plan not found");
  });

  it("should return 403 if user is not the owner of the lesson plan", async () => {
    vi.mocked(verifyUser).mockResolvedValueOnce({
      errorResponse: null,
      session: { user: { id: "user-1" } },
    } as any);

    vi.mocked(prisma.lessonPlan.findUnique).mockResolvedValueOnce({
      id: "plan-1",
      userId: "user-2", // different owner
    } as any);

    const req = new Request("http://localhost/api/lesson-plan/plan-1/worksheet", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: "plan-1" }) });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe("Forbidden");
  });

  it("should generate worksheet, update DB, and return updated plan on success", async () => {
    vi.mocked(verifyUser).mockResolvedValueOnce({
      errorResponse: null,
      session: {
        user: { id: "user-1", email: "user@test.com", name: "Test User" },
      },
    } as any);

    vi.mocked(prisma.lessonPlan.findUnique).mockResolvedValueOnce({
      id: "plan-1",
      userId: "user-1",
      structure: {
        type: "lesson",
        title: "Test Lesson Title",
        subject: "Math",
        gradeLevel: "Grade 6",
      },
    } as any);

    const mockGroqResponse = {
      choices: [
        {
          message: {
            content: "# Student Worksheet: Test Lesson Title\n\n## 1. Core Concept Explanations\n...",
          },
        },
      ],
    };

    vi.mocked(groq.chat.completions.create).mockResolvedValueOnce(mockGroqResponse as any);

    const mockUpdatedPlan = {
      id: "plan-1",
      userId: "user-1",
      structure: {
        type: "lesson",
        title: "Test Lesson Title",
        subject: "Math",
        gradeLevel: "Grade 6",
        worksheet: "# Student Worksheet: Test Lesson Title\n\n## 1. Core Concept Explanations\n...",
      },
    };

    vi.mocked(prisma.lessonPlan.update).mockResolvedValueOnce(mockUpdatedPlan as any);

    const req = new Request("http://localhost/api/lesson-plan/plan-1/worksheet", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: "plan-1" }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.lessonPlan).toEqual(mockUpdatedPlan);

    expect(groq.chat.completions.create).toHaveBeenCalled();
    expect(prisma.lessonPlan.update).toHaveBeenCalledWith({
      where: { id: "plan-1" },
      data: {
        structure: mockUpdatedPlan.structure,
        blobUrl: null,
      },
    });
  });
});
