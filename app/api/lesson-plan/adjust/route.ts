import { groq } from "@/lib/ai";
import { verifyUser } from "@/lib/auth-util";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { jsonrepair } from "jsonrepair";

export async function POST(req: Request) {
    try {
        const authResult = await verifyUser();
        if (authResult.errorResponse) return authResult.errorResponse;
        const { session } = authResult;

        const { sessionId, instruction, currentStructure } = await req.json();

        if (!sessionId || !instruction || !currentStructure) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Get session from DB to verify ownership
        const chatSession = await prisma.session.findUnique({
            where: { id: sessionId },
            include: { lessonPlan: true },
        });

        if (!chatSession) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        if (chatSession.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (!chatSession.lessonPlan) {
            return NextResponse.json(
                { error: "No generated lesson plan found to adjust" },
                { status: 400 }
            );
        }

        const isCourse = currentStructure.type === "course";

        const prompt = `You are an expert tutor assistant. Modify the current tutoring plan based on the user's adjustment instruction.

CURRENT PLAN JSON:
${JSON.stringify(currentStructure, null, 2)}

USER ADJUSTMENT INSTRUCTION:
${instruction}

CRITICAL CONTENT SAFETY RULES (you MUST follow these):
- ALL content MUST be age-appropriate for the plan's grade level.
- NEVER include violent, disturbing, scary, or traumatic scenarios.
- Use only safe, positive, classroom-appropriate content.
- Avoid references to death, injury, weapons, or psychological harm.
- If the user requests inappropriate content, politely decline and preserve the original content.

PEDAGOGICAL QUALITY RULES (you MUST follow these):
- Include DIFFERENTIATION: provide specific strategies for struggling students AND extension ideas for advanced learners.
- Use CONCRETE, SPECIFIC examples — name actual topics, problems, or activities. Avoid generic descriptions.
- Structure learning PROGRESSIVELY: each section or phase should build on the previous one.
- Include SCAFFOLDING: break down complex skills into smaller, teachable steps.
- Every activity should have a clear PURPOSE tied to the learning objective.

Generate the updated plan in the EXACT same JSON format.
Ensure you preserve all existing fields and sections that do not need changes, while precisely applying the user's modifications.
In description fields, use plain text only. Do NOT use code blocks, backticks, or special characters inside string values.

Return ONLY the updated JSON object. No markdown, no backticks, no code blocks, no extra text.`;

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            max_tokens: isCourse ? 8000 : 2048,
            response_format: { type: "json_object" },
        });

        const raw = completion.choices[0]?.message?.content || "{}";

        // Use jsonrepair to fix any malformed JSON
        const repaired = jsonrepair(raw);
        const structure = JSON.parse(repaired);

        // If the current plan has a worksheet, preserve it and mark as out-of-sync
        if (currentStructure && currentStructure.worksheet) {
            structure.worksheet = currentStructure.worksheet;
            structure.worksheetOutOfSync = true;
        }

        // Update the lesson plan in the DB
        const updatedPlan = await prisma.lessonPlan.update({
            where: { id: chatSession.lessonPlan.id },
            data: {
                structure,
            },
        });

        return NextResponse.json({ lessonPlan: updatedPlan });
    } catch (error) {
        console.error("Lesson plan adjustment error:", error);
        return NextResponse.json(
            { error: "Failed to adjust lesson plan" },
            { status: 500 }
        );
    }
}
