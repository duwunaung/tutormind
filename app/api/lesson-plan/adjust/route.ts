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
