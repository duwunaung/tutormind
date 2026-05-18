import Groq from "groq-sdk";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { jsonrepair } from "jsonrepair";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { sessionId } = await req.json();

        // Check if lesson plan already exists
        const existing = await prisma.lessonPlan.findUnique({
            where: { sessionId },
        });

        if (existing) {
            return NextResponse.json({ lessonPlan: existing });
        }

        // Get session from DB
        const chatSession = await prisma.session.findUnique({
            where: { id: sessionId },
        });

        if (!chatSession) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        // Build chat summary for Groq
        const messages = chatSession.messages as any[];
        const chatHistory = messages
            .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
            .join("\n\n");

        const prompt = `Based on this tutoring chat session, generate a structured lesson plan.

CHAT SESSION:
${chatHistory}

Generate a detailed lesson plan in this EXACT JSON format. 
IMPORTANT: In description fields, use plain text only. Do NOT use code blocks, backticks, or special characters inside string values.

{
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
            max_tokens: 2048,
            response_format: { type: "json_object" }, // ✅ Force JSON mode
        });

        const raw = completion.choices[0]?.message?.content || "{}";
        console.log("Raw AI response:", raw); // ✅ Log for debugging

        // Use jsonrepair to fix any malformed JSON
        const repaired = jsonrepair(raw);
        const structure = JSON.parse(repaired);

        // Save lesson plan to DB
        const lessonPlan = await prisma.lessonPlan.create({
            data: {
                structure,
                userId: session.user.id,
                sessionId,
            },
        });

        return NextResponse.json({ lessonPlan });
    } catch (error) {
        console.error("Lesson plan error:", error);
        return NextResponse.json(
            { error: "Failed to generate lesson plan" },
            { status: 500 }
        );
    }
}