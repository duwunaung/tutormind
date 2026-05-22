import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/auth-util";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { generateDocx, LessonPlan } from "@/lib/generators/docx";
import { createAuditLog } from "@/lib/audit-logger";

export async function POST(req: Request) {
  try {
    const authResult = await verifyUser();
    if (authResult.errorResponse) return authResult.errorResponse;
    const { session } = authResult;

    const { lessonPlanId, format } = await req.json();

    const lessonPlan = await prisma.lessonPlan.findUnique({
      where: { id: lessonPlanId },
    });

    if (!lessonPlan) {
      return NextResponse.json({ error: "Lesson plan not found" }, { status: 404 });
    }

    if (lessonPlan.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const structure = lessonPlan.structure as unknown as LessonPlan;
    const filename = `${structure.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;

    let fileBuffer: Buffer;
    let contentType: string;
    let fileExtension: string;

    if (format === "docx") {
      fileBuffer = await generateDocx(structure);
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      fileExtension = "docx";
    } else {
      return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }

    // Upload to Vercel Blob
    const blob = await put(
      `lesson-plans/${session.user.id}/${filename}.${fileExtension}`,
      fileBuffer,
      {
        access: "public",
        contentType,
      }
    );

    // Save blob URL to DB
    await prisma.lessonPlan.update({
      where: { id: lessonPlanId },
      data: { blobUrl: blob.url },
    });

    await createAuditLog({
      action: "EXPORT_PLAN",
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorName: session.user.name,
      targetId: lessonPlan.id,
      targetName: structure.title,
      details: { format, blobUrl: blob.url },
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export lesson plan" },
      { status: 500 }
    );
  }
}