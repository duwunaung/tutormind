import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { verifyUser } from "@/lib/auth-util";
import { prisma } from "@/lib/prisma";
import { groq } from "@/lib/ai";
import { createAuditLog } from "@/lib/audit-logger";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyUser();
    if (authResult.errorResponse) return authResult.errorResponse;
    const { session } = authResult;

    const { id } = await params;

    // Fetch the lesson plan
    const lessonPlan = await prisma.lessonPlan.findUnique({
      where: { id },
    });

    if (!lessonPlan) {
      return NextResponse.json({ error: "Lesson plan not found" }, { status: 404 });
    }

    if (lessonPlan.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const structure = lessonPlan.structure as Prisma.JsonObject;

    const prompt = `You are an expert curriculum builder. Based on the following generated ${structure.type} plan, create a comprehensive, highly-detailed student worksheet and homework handout.

LESSON PLAN DETAILS:
- Subject: ${structure.subject}
- Grade Level: ${structure.gradeLevel}
- Title: ${structure.title}
- Objectives: ${Array.isArray(structure.objectives) ? structure.objectives.join(", ") : ""}
- Materials Needed: ${Array.isArray(structure.materials) ? structure.materials.join(", ") : ""}
- Plan Outline: ${JSON.stringify(structure)}

Please generate the content in this EXACT Markdown structure:

# Student Worksheet: ${structure.title}

## 1. Core Concept Explanations
[Provide clear, student-friendly explanations of the core topics covered in this plan, complete with any key definitions, rules, or formulas.]

## 2. Rich Solved Examples
[Provide at least 3 detailed, step-by-step solved examples that walk the student through how to solve these types of problems or apply the concept. Include explanations of the thought process for each step.]

## 3. Practice Exercises
[Provide 5 concrete practice problems or exercises for the student to solve during the session.]

---

# Student Homework: ${structure.title}

## Homework Tasks
[Provide a structured homework assignment with 3-5 specific questions, activities, or coding tasks for the student to complete independently.]

---

# Tutor Answer Key (Tutor Use Only)

## Practice Exercises Answer Key
[Provide detailed step-by-step answers and explanations for the 5 practice exercises above.]

## Homework Answer Key
[Provide detailed answers, solutions, and grading criteria for the homework tasks above.]

IMPORTANT:
- Use clean Markdown styling with headers, lists, and bold text.
- Do NOT use backticks (\`\`\`) inside the content unless you are showing code blocks.
- Do NOT wrap the entire response in markdown code blocks. Start directly with the "# Student Worksheet" header.
- Make all examples and problems highly concrete and specific to the subject matter (e.g. if the topic is Git, write actual git commands and scenarios; if it's math, write actual numbers and equations).`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 3000,
      temperature: 0.7,
    });

    const worksheet = completion.choices[0]?.message?.content || "";

    if (!worksheet) {
      return NextResponse.json(
        { error: "Failed to generate content from AI" },
        { status: 500 }
      );
    }

    const updatedStructure = {
      ...structure,
      worksheet,
    };
    delete (updatedStructure as any).worksheetOutOfSync;

    const updatedPlan = await prisma.lessonPlan.update({
      where: { id },
      data: {
        structure: updatedStructure as Prisma.InputJsonValue,
        blobUrl: null,
      },
    });

    await createAuditLog({
      action: "EDIT_PLAN",
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorName: session.user.name,
      targetId: id,
      targetName: String(structure.title),
      details: { type: String(structure.type), actionType: "generate_worksheet" },
    });

    return NextResponse.json({ lessonPlan: updatedPlan });
  } catch (error) {
    console.error("Worksheet generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate worksheet" },
      { status: 500 }
    );
  }
}
