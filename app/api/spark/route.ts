import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/auth-util";
import { groq } from "@/lib/ai";
import { jsonrepair } from "jsonrepair";
import { createAuditLog } from "@/lib/audit-logger";

export async function POST(req: Request) {
  try {
    const authResult = await verifyUser();
    if (authResult.errorResponse) return authResult.errorResponse;
    const { session } = authResult;

    const { topic, subject, gradeLevel } = await req.json();

    if (!topic || !topic.trim()) {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    const prompt = `You are an expert creative educator. Generate three quick, high-engagement teaching ideas for the topic: "${topic.trim()}"${subject ? `, within the subject area of '${subject}'` : ""}${gradeLevel ? `, specifically tailored for students at the '${gradeLevel}' level` : ""}.

CRITICAL CONTENT SAFETY RULES (you MUST follow these):
- ALL content MUST be age-appropriate for ${gradeLevel || "the specified grade level"} students.
- NEVER include violent, disturbing, scary, or traumatic scenarios.
- Use only safe, positive, classroom-appropriate content.
- Avoid references to death, injury, weapons, or psychological harm.
- For young students (K-8), use only gentle, fun, everyday examples.
- Games and activities must be safe, inclusive, and feasible in a classroom setting.

Format your response as a JSON object with exactly these fields:
{
  "hook": "A 5-minute attention-grabbing hook or icebreaker to start the lesson.",
  "game": "A quick, active classroom game or hands-on activity to reinforce the concept.",
  "analogy": "A simple, memorable real-world analogy to explain 'why this matters' to students."
}

Return ONLY this JSON object. No markdown formatting, no code blocks, no other text.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024,
      temperature: 0.6,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const repaired = jsonrepair(raw);
    const result = JSON.parse(repaired);

    await createAuditLog({
      action: "GENERATE_SPARK",
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorName: session.user.name,
      targetId: null,
      targetName: topic.trim(),
      details: { topic: topic.trim(), subject, gradeLevel },
    });

    return NextResponse.json({ spark: result });
  } catch (error) {
    console.error("AI Spark generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate teaching ideas" },
      { status: 500 }
    );
  }
}
