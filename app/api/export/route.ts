import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { generateDocx } from "@/lib/generators/docx";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lessonPlanId, format } = await req.json();

    const lessonPlan = await prisma.lessonPlan.findUnique({
      where: { id: lessonPlanId },
    });

    if (!lessonPlan) {
      return NextResponse.json({ error: "Lesson plan not found" }, { status: 404 });
    }

    const structure = lessonPlan.structure as any;
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

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export lesson plan" },
      { status: 500 }
    );
  }
}