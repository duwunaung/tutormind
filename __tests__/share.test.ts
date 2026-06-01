/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH } from "@/app/api/lesson-plan/[id]/share/route";
import { GET } from "@/app/api/share/[id]/route";
import { prisma } from "@/lib/prisma";
import { verifyUser } from "@/lib/auth-util";
import { NextResponse } from "next/server";

vi.mock("@/lib/auth-util", () => ({
  verifyUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    lessonPlan: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("Share Routes Integration tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("PATCH /api/lesson-plan/[id]/share", () => {
    it("should return 401 if user session is invalid", async () => {
      vi.mocked(verifyUser).mockResolvedValueOnce({
        errorResponse: new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
        session: null,
      } as any);

      const req = new Request("http://localhost/api/lesson-plan/plan-123/share", {
        method: "PATCH",
        body: JSON.stringify({ isShared: true }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: "plan-123" }) });
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 404 if plan is not found", async () => {
      vi.mocked(verifyUser).mockResolvedValueOnce({
        errorResponse: null,
        session: { user: { id: "user-1" } },
      } as any);
      vi.mocked(prisma.lessonPlan.findUnique).mockResolvedValueOnce(null);

      const req = new Request("http://localhost/api/lesson-plan/plan-404/share", {
        method: "PATCH",
        body: JSON.stringify({ isShared: true }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: "plan-404" }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Lesson plan not found");
    });

    it("should return 403 if user is not the owner", async () => {
      vi.mocked(verifyUser).mockResolvedValueOnce({
        errorResponse: null,
        session: { user: { id: "user-1" } },
      } as any);
      vi.mocked(prisma.lessonPlan.findUnique).mockResolvedValueOnce({
        id: "plan-123",
        userId: "user-2", // different owner
        structure: {},
      } as any);

      const req = new Request("http://localhost/api/lesson-plan/plan-123/share", {
        method: "PATCH",
        body: JSON.stringify({ isShared: true }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: "plan-123" }) });
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should toggle isShared and return 200 on owner success", async () => {
      vi.mocked(verifyUser).mockResolvedValueOnce({
        errorResponse: null,
        session: { user: { id: "user-1" } },
      } as any);

      const oldPlan = {
        id: "plan-123",
        userId: "user-1",
        structure: { title: "Metaphors" },
      };

      vi.mocked(prisma.lessonPlan.findUnique).mockResolvedValueOnce(oldPlan as any);

      const updatedPlan = {
        id: "plan-123",
        structure: { title: "Metaphors", isShared: true },
      };
      vi.mocked(prisma.lessonPlan.update).mockResolvedValueOnce(updatedPlan as any);

      const req = new Request("http://localhost/api/lesson-plan/plan-123/share", {
        method: "PATCH",
        body: JSON.stringify({ isShared: true }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: "plan-123" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.lessonPlan).toEqual(updatedPlan);
      expect(prisma.lessonPlan.update).toHaveBeenCalledWith({
        where: { id: "plan-123" },
        data: {
          structure: { title: "Metaphors", isShared: true },
        },
      });
    });
  });

  describe("GET /api/share/[id]", () => {
    it("should return 404 if plan is not found", async () => {
      vi.mocked(prisma.lessonPlan.findUnique).mockResolvedValueOnce(null);

      const req = new Request("http://localhost/api/share/plan-404");
      const res = await GET(req, { params: Promise.resolve({ id: "plan-404" }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Lesson plan not found");
    });

    it("should return 403 if plan is private (isShared false)", async () => {
      vi.mocked(prisma.lessonPlan.findUnique).mockResolvedValueOnce({
        id: "plan-123",
        structure: { title: "Metaphors", isShared: false },
      } as any);

      const req = new Request("http://localhost/api/share/plan-123");
      const res = await GET(req, { params: Promise.resolve({ id: "plan-123" }) });
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toBe("This plan is private");
    });

    it("should return 200 and strip tutor key if plan is shared", async () => {
      const dbPlan = {
        id: "plan-123",
        structure: {
          title: "Metaphors",
          subject: "English",
          gradeLevel: "Grade 6",
          isShared: true,
          worksheet: "Student Worksheet Section\n\n# Student Homework:\nHomework problems\n\n# Tutor Answer Key\nAnswer key secrets do not leak",
        },
      };
      vi.mocked(prisma.lessonPlan.findUnique).mockResolvedValueOnce(dbPlan as any);

      const req = new Request("http://localhost/api/share/plan-123");
      const res = await GET(req, { params: Promise.resolve({ id: "plan-123" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.lessonPlan.title).toBe("Metaphors");
      expect(data.lessonPlan.subject).toBe("English");
      expect(data.lessonPlan.gradeLevel).toBe("Grade 6");
      
      // Verify stripping logic
      expect(data.lessonPlan.worksheet).toContain("Student Worksheet Section");
      expect(data.lessonPlan.worksheet).toContain("Homework problems");
      expect(data.lessonPlan.worksheet).not.toContain("Tutor Answer Key");
      expect(data.lessonPlan.worksheet).not.toContain("Answer key secrets do not leak");
    });
  });
});
