import { groq } from "@/lib/ai";
import { auth } from "@/auth";
import { getSystemPrompt } from "@/lib/prompts";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, subject } = await req.json();

    const filtered = messages.filter((_: any, i: number) => {
      if (i === 0 && messages[0].role === "assistant") return false;
      return true;
    });

    const groqMessages = [
      { role: "system" as const, content: getSystemPrompt(subject) },
      ...filtered.map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: groqMessages,
      max_tokens: 1024,
    });

    const raw = completion.choices[0]?.message?.content || "";

    // Detect ready signal and strip it from the displayed message
    const ready = raw.includes("[READY_TO_GENERATE]");
    const message = raw.replace("[READY_TO_GENERATE]", "").trim();

    return NextResponse.json({ message, ready });
  } catch (error) {
    console.error("Groq error:", error);
    return NextResponse.json({ error: "Failed to get AI response" }, { status: 500 });
  }
}