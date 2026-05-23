/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/lesson-plan/adjust/route";
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
    session: {
      findUnique: vi.fn(),
    },
    lessonPlan: {
      update: vi.fn(),
    },
  },
}));

describe("Lesson Plan Adjust Route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return error response if user session is invalid", async () => {
    vi.mocked(verifyUser).mockResolvedValueOnce({
      errorResponse: new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
      session: null,
    } as any);

    const req = new Request("http://localhost/api/lesson-plan/adjust", {
      method: "POST",
      body: JSON.stringify({
        sessionId: "session-1",
        instruction: "Change details",
        currentStructure: { type: "lesson" },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 400 if required fields are missing", async () => {
    vi.mocked(verifyUser).mockResolvedValueOnce({
      errorResponse: null,
      session: { user: { id: "user-1" } },
    } as any);

    const req = new Request("http://localhost/api/lesson-plan/adjust", {
      method: "POST",
      body: JSON.stringify({
        sessionId: "session-1",
        // missing instruction and currentStructure
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Missing required fields");
  });

  it("should return 404 if session does not exist", async () => {
    vi.mocked(verifyUser).mockResolvedValueOnce({
      errorResponse: null,
      session: { user: { id: "user-1" } },
    } as any);

    vi.mocked(prisma.session.findUnique).mockResolvedValueOnce(null);

    const req = new Request("http://localhost/api/lesson-plan/adjust", {
      method: "POST",
      body: JSON.stringify({
        sessionId: "session-not-found",
        instruction: "make it beginner friendly",
        currentStructure: { type: "lesson" },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Session not found");
  });

  it("should return 403 if session belongs to another user", async () => {
    vi.mocked(verifyUser).mockResolvedValueOnce({
      errorResponse: null,
      session: { user: { id: "user-1" } },
    } as any);

    vi.mocked(prisma.session.findUnique).mockResolvedValueOnce({
      id: "session-1",
      userId: "user-2", // different owner
    } as any);

    const req = new Request("http://localhost/api/lesson-plan/adjust", {
      method: "POST",
      body: JSON.stringify({
        sessionId: "session-1",
        instruction: "make it beginner friendly",
        currentStructure: { type: "lesson" },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe("Forbidden");
  });

  it("should return 400 if session does not have a generated plan", async () => {
    vi.mocked(verifyUser).mockResolvedValueOnce({
      errorResponse: null,
      session: { user: { id: "user-1" } },
    } as any);

    vi.mocked(prisma.session.findUnique).mockResolvedValueOnce({
      id: "session-1",
      userId: "user-1",
      lessonPlan: null, // missing generated plan
    } as any);

    const req = new Request("http://localhost/api/lesson-plan/adjust", {
      method: "POST",
      body: JSON.stringify({
        sessionId: "session-1",
        instruction: "make it beginner friendly",
        currentStructure: { type: "lesson" },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("No generated lesson plan found to adjust");
  });

  it("should adjust structure, invoke groq API, update DB, and return updated plan on success", async () => {
    vi.mocked(verifyUser).mockResolvedValueOnce({
      errorResponse: null,
      session: { user: { id: "user-1" } },
    } as any);

    vi.mocked(prisma.session.findUnique).mockResolvedValueOnce({
      id: "session-1",
      userId: "user-1",
      lessonPlan: { id: "plan-1" },
    } as any);

    const mockGroqResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              type: "lesson",
              title: "Adjusted Title",
              subject: "Science",
              gradeLevel: "Grade 6",
            }),
          },
        },
      ],
    };

    vi.mocked(groq.chat.completions.create).mockResolvedValueOnce(mockGroqResponse as any);

    const mockUpdatedPlan = {
      id: "plan-1",
      structure: {
        type: "lesson",
        title: "Adjusted Title",
        subject: "Science",
        gradeLevel: "Grade 6",
      },
    };

    vi.mocked(prisma.lessonPlan.update).mockResolvedValueOnce(mockUpdatedPlan as any);

    const req = new Request("http://localhost/api/lesson-plan/adjust", {
      method: "POST",
      body: JSON.stringify({
        sessionId: "session-1",
        instruction: "Change title to Adjusted Title",
        currentStructure: { type: "lesson", title: "Original Title" },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.lessonPlan).toEqual(mockUpdatedPlan);

    expect(groq.chat.completions.create).toHaveBeenCalled();
    expect(prisma.lessonPlan.update).toHaveBeenCalledWith({
      where: { id: "plan-1" },
      data: {
        structure: mockUpdatedPlan.structure,
      },
    });
  });
});
