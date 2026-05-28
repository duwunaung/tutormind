import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/auth-util";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit-logger";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyUser();
    if (authResult.errorResponse) return authResult.errorResponse;
    const { session } = authResult;

    const { id } = await params;
    const { structure } = await req.json();

    if (!structure) {
      return NextResponse.json({ error: "Structure is required" }, { status: 400 });
    }

    // Basic structure validation
    if (!structure.type || !structure.title || !structure.subject || !structure.gradeLevel) {
      return NextResponse.json(
        { error: "Invalid lesson plan structure: missing required fields" },
        { status: 400 }
      );
    }

    const lessonPlan = await prisma.lessonPlan.findUnique({
      where: { id },
    });

    if (!lessonPlan) {
      return NextResponse.json({ error: "Lesson plan not found" }, { status: 404 });
    }

    if (lessonPlan.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update structure, reset blobUrl to null since previous generated document is obsolete
    const updated = await prisma.lessonPlan.update({
      where: { id },
      data: {
        structure,
        blobUrl: null,
      },
    });

    // Update the parent session title to match the new structure title
    await prisma.session.update({
      where: { id: lessonPlan.sessionId },
      data: { title: structure.title },
    });

    await createAuditLog({
      action: "EDIT_PLAN",
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorName: session.user.name,
      targetId: id,
      targetName: structure.title,
      details: { type: structure.type },
    });

    return NextResponse.json({ lessonPlan: updated });
  } catch (error) {
    console.error("Update lesson plan error:", error);
    return NextResponse.json(
      { error: "Failed to update lesson plan" },
      { status: 500 }
    );
  }
}
