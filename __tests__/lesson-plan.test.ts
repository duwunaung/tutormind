/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH } from "@/app/api/lesson-plan/[id]/route";
import { prisma } from "@/lib/prisma";
import { verifyUser } from "@/lib/auth-util";
import { createAuditLog } from "@/lib/audit-logger";
import { NextResponse } from "next/server";

vi.mock("@/lib/auth-util", () => ({
  verifyUser: vi.fn(),
}));

vi.mock("@/lib/audit-logger", () => ({
  createAuditLog: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    lessonPlan: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("Lesson Plan PATCH API Route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return error response if user session is invalid", async () => {
    vi.mocked(verifyUser).mockResolvedValueOnce({
      errorResponse: new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
      session: null,
    } as any);

    const req = new Request("http://localhost/api/lesson-plan/plan-1", {
      method: "PATCH",
      body: JSON.stringify({}),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "plan-1" }) });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 400 if structure is missing", async () => {
    vi.mocked(verifyUser).mockResolvedValueOnce({
      errorResponse: null,
      session: { user: { id: "user-1" } },
    } as any);

    const req = new Request("http://localhost/api/lesson-plan/plan-1", {
      method: "PATCH",
      body: JSON.stringify({}),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "plan-1" }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Structure is required");
  });

  it("should return 400 if structure missing required fields", async () => {
    vi.mocked(verifyUser).mockResolvedValueOnce({
      errorResponse: null,
      session: { user: { id: "user-1" } },
    } as any);

    const req = new Request("http://localhost/api/lesson-plan/plan-1", {
      method: "PATCH",
      body: JSON.stringify({
        structure: {
          title: "Incomplete Plan",
        },
      }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "plan-1" }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("missing required fields");
  });

  it("should return 404 if lesson plan not found", async () => {
    vi.mocked(verifyUser).mockResolvedValueOnce({
      errorResponse: null,
      session: { user: { id: "user-1" } },
    } as any);

    vi.mocked(prisma.lessonPlan.findUnique).mockResolvedValueOnce(null);

    const req = new Request("http://localhost/api/lesson-plan/plan-1", {
      method: "PATCH",
      body: JSON.stringify({
        structure: {
          type: "lesson",
          title: "Valid Title",
          subject: "Science",
          gradeLevel: "Grade 6",
        },
      }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "plan-1" }) });
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

    const req = new Request("http://localhost/api/lesson-plan/plan-1", {
      method: "PATCH",
      body: JSON.stringify({
        structure: {
          type: "lesson",
          title: "Valid Title",
          subject: "Science",
          gradeLevel: "Grade 6",
        },
      }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "plan-1" }) });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe("Forbidden");
  });

  it("should update structure, clear blobUrl, log audit action and return updated plan on success", async () => {
    const sessionUser = { id: "user-1", email: "user@test.com", name: "Test User" };
    vi.mocked(verifyUser).mockResolvedValueOnce({
      errorResponse: null,
      session: { user: sessionUser },
    } as any);

    vi.mocked(prisma.lessonPlan.findUnique).mockResolvedValueOnce({
      id: "plan-1",
      userId: "user-1",
      structure: {},
    } as any);

    const mockUpdatedPlan = {
      id: "plan-1",
      userId: "user-1",
      structure: {
        type: "lesson",
        title: "Updated Title",
        subject: "Science",
        gradeLevel: "Grade 6",
      },
      blobUrl: null,
    };

    vi.mocked(prisma.lessonPlan.update).mockResolvedValueOnce(mockUpdatedPlan as any);

    const req = new Request("http://localhost/api/lesson-plan/plan-1", {
      method: "PATCH",
      body: JSON.stringify({
        structure: mockUpdatedPlan.structure,
      }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "plan-1" }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.lessonPlan).toEqual(mockUpdatedPlan);

    expect(prisma.lessonPlan.update).toHaveBeenCalledWith({
      where: { id: "plan-1" },
      data: {
        structure: mockUpdatedPlan.structure,
        blobUrl: null,
      },
    });

    expect(createAuditLog).toHaveBeenCalledWith({
      action: "EDIT_PLAN",
      actorId: sessionUser.id,
      actorEmail: sessionUser.email,
      actorName: sessionUser.name,
      targetId: "plan-1",
      targetName: mockUpdatedPlan.structure.title,
      details: { type: "lesson" },
    });
  });

  it("should return 500 if prisma update fails", async () => {
    vi.mocked(verifyUser).mockResolvedValueOnce({
      errorResponse: null,
      session: { user: { id: "user-1" } },
    } as any);

    vi.mocked(prisma.lessonPlan.findUnique).mockResolvedValueOnce({
      id: "plan-1",
      userId: "user-1",
    } as any);

    vi.mocked(prisma.lessonPlan.update).mockRejectedValueOnce(new Error("Database write error"));

    const req = new Request("http://localhost/api/lesson-plan/plan-1", {
      method: "PATCH",
      body: JSON.stringify({
        structure: {
          type: "lesson",
          title: "Valid Title",
          subject: "Science",
          gradeLevel: "Grade 6",
        },
      }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "plan-1" }) });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Failed to update lesson plan");
  });
});
