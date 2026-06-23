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

        const { sessionId } = await req.json();

        // Check if lesson plan already exists
        const existing = await prisma.lessonPlan.findUnique({
            where: { sessionId },
        });

        if (existing) {
            if (existing.userId !== session.user.id) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
            return NextResponse.json({ lessonPlan: existing });
        }

        // Get session from DB
        const chatSession = await prisma.session.findUnique({
            where: { id: sessionId },
        });

        if (!chatSession) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        if (chatSession.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Build chat summary for Groq
        const messages = chatSession.messages as { role: string; content: string; ready?: boolean }[];

        // Validation check for session readiness (only allow wizard flows or chat flows with ready status)
        const isWizard = Array.isArray(messages) && messages.length > 0 && messages[0].role === "user";
        const isChatReady = Array.isArray(messages) && messages.some((m) => m.role === "assistant" && m.ready === true);

        if (!isWizard && !isChatReady) {
            return NextResponse.json(
                { error: "Session is not ready for generation. Please finish the chat session first." },
                { status: 400 }
            );
        }

        const chatHistory = messages
            .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
            .join("\n\n");

        // Detect if this is a course plan or single lesson
        let isCourse = chatSession.planType === "course";

        // Fallback to chat history parsing only if planType is the default "lesson" AND it was a chat flow (starts with assistant message)
        const isChatFlow = Array.isArray(messages) && messages.length > 0 && messages[0].role === "assistant";
        if (isChatFlow && chatSession.planType === "lesson") {
            isCourse =
                chatHistory.toLowerCase().includes("course") ||
                chatHistory.toLowerCase().includes("sections") ||
                chatHistory.toLowerCase().includes("curriculum");
        }

        const prompt = isCourse
            ? `Based on this tutoring chat session, generate a full course plan.

CHAT SESSION:
${chatHistory}

CRITICAL CONTENT SAFETY RULES (you MUST follow these):
- ALL content MUST be age-appropriate for the grade level specified in the chat.
- NEVER include violent, disturbing, scary, or traumatic scenarios in any example, activity, or material.
- Use only safe, positive, classroom-appropriate content.
- Avoid references to death, injury, weapons, or psychological harm.
- Materials suggested must be real, classroom-feasible items (e.g. pencils, worksheets, whiteboard, lab equipment).
- For young students (K-8), use only gentle, fun, everyday examples.

PEDAGOGICAL QUALITY RULES (you MUST follow these):
- Include DIFFERENTIATION: provide specific strategies for struggling students AND extension ideas for advanced learners.
- Use CONCRETE, SPECIFIC examples — name actual topics, activities, or problems. Avoid generic descriptions.
- Structure learning PROGRESSIVELY across sections: each section should build on the previous one.
- Include SCAFFOLDING: break down complex skills into smaller, teachable steps within each section.
- Every section activity should have a clear PURPOSE tied to the learning objective.

Generate a detailed course plan in this EXACT JSON format.
IMPORTANT: You MUST calculate the exact number of session sections needed based on the "Course duration" and "Sessions per week" specified in the chat history (for example, "2 weeks" duration at "3x sessions per week" = 6 sessions). You must generate exactly that number of section objects in the "sections" array (each object representing one session). Do not generate extra sections or sessions beyond this calculated count.
IMPORTANT: In description fields, use plain text only. Do NOT use code blocks, backticks, or special characters inside string values.

{
  "type": "course",
  "title": "Course title here",
  "subject": "${chatSession.subject}",
  "gradeLevel": "Grade level from context",
  "totalDuration": "Total duration (e.g. 16 hours)",
  "courseOverview": "Brief overview of the entire course",
  "objectives": ["overall objective 1", "overall objective 2", "overall objective 3"],
  "materials": ["material 1", "material 2"],
  "sections": [
    {
      "sectionNumber": 1,
      "title": "Section title",
      "duration": "1 hour",
      "objectives": ["objective 1", "objective 2"],
      "description": "What this section covers",
      "activities": "Main activities for this section",
      "assessment": "How to assess this section"
    }
  ],
  "finalAssessment": "Description of final assessment or project",
  "notes": "Any additional teaching notes"
}

IMPORTANT: Generate ALL sections as calculated. If the user asked for X sections, generate exactly X sections in the sections array.
Return ONLY the JSON object. No markdown, no backticks, no code blocks, no extra text.`

            : `Based on this tutoring chat session, generate a structured lesson plan.

CHAT SESSION:
${chatHistory}

CRITICAL CONTENT SAFETY RULES (you MUST follow these):
- ALL content MUST be age-appropriate for the grade level specified in the chat.
- NEVER include violent, disturbing, scary, or traumatic scenarios in any example, activity, or material.
- Use only safe, positive, classroom-appropriate content.
- Avoid references to death, injury, weapons, or psychological harm.
- Materials suggested must be real, classroom-feasible items (e.g. pencils, worksheets, whiteboard, props).
- For young students (K-8), use only gentle, fun, everyday examples.

PEDAGOGICAL QUALITY RULES (you MUST follow these):
- Include DIFFERENTIATION: provide specific strategies for struggling students AND extension ideas for advanced learners.
- Use CONCRETE, SPECIFIC examples — name actual topics, problems, or activities. Avoid generic descriptions.
- Structure learning PROGRESSIVELY: introduction should set foundation, main activity builds on it, wrap-up reinforces.
- Include SCAFFOLDING: break down complex skills into smaller, teachable steps.
- Every activity should have a clear PURPOSE tied to the learning objective.

Generate a detailed lesson plan in this EXACT JSON format.
IMPORTANT: In description fields, use plain text only. Do NOT use code blocks, backticks, or special characters inside string values.

{
  "type": "lesson",
  "title": "Lesson title here",
  "subject": "${chatSession.subject}",
  "gradeLevel": "Grade level from context",
  "duration": "Estimated duration (e.g. 60 minutes)",
  "objectives": ["objective 1", "objective 2", "objective 3"],
  "materials": ["material 1", "material 2"],
  "lessonStructure": {
    "introduction": { "duration": "10 minutes", "description": "What to do in intro" },
    "mainActivity": { "duration": "35 minutes", "description": "Main teaching activity" },
    "wrapUp": { "duration": "15 minutes", "description": "How to wrap up" }
  },
  "assessment": ["assessment idea 1", "assessment idea 2"],
  "homework": "Homework description here",
  "notes": "Any additional teaching notes"
}

Return ONLY the JSON object. No markdown, no backticks, no code blocks, no extra text.`;

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            max_tokens: isCourse ? 8000 : 2048, // ✅ More tokens for course plans
            response_format: { type: "json_object" },
        });

        const raw = completion.choices[0]?.message?.content || "{}";

        // Use jsonrepair to fix any malformed JSON
        const repaired = jsonrepair(raw);
        const structure = JSON.parse(repaired);

        // Save lesson plan to DB and update session planType
        const [lessonPlan] = await prisma.$transaction([
            prisma.lessonPlan.create({
                data: {
                    structure,
                    userId: session.user.id,
                    sessionId,
                },
            }),
            prisma.session.update({
                where: { id: sessionId },
                data: { planType: isCourse ? "course" : "lesson" },
            }),
        ]);

        return NextResponse.json({ lessonPlan });
    } catch (error) {
        console.error("Lesson plan error:", error);
        return NextResponse.json(
            { error: "Failed to generate lesson plan" },
            { status: 500 }
        );
    }
}