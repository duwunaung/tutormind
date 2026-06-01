import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const lessonPlan = await prisma.lessonPlan.findUnique({
      where: { id },
    });

    if (!lessonPlan) {
      return NextResponse.json({ error: "Lesson plan not found" }, { status: 404 });
    }

    const structure = (lessonPlan.structure || {}) as any;

    if (!structure.isShared) {
      return NextResponse.json({ error: "This plan is private" }, { status: 403 });
    }

    // Strip out tutor answer key for security
    let worksheetContent = structure.worksheet || "";
    const keyMarker = "# Tutor Answer Key";
    const keyIdx = worksheetContent.indexOf(keyMarker);
    if (keyIdx !== -1) {
      worksheetContent = worksheetContent.substring(0, keyIdx).trim();
    }

    // Return only student-relevant structure details
    const publicData = {
      title: structure.title,
      subject: structure.subject,
      gradeLevel: structure.gradeLevel,
      worksheet: worksheetContent,
    };

    return NextResponse.json({ lessonPlan: publicData });
  } catch (error) {
    console.error("Public share GET error:", error);
    return NextResponse.json(
      { error: "Failed to load public lesson plan" },
      { status: 500 }
    );
  }
}
