import { groq } from "@/lib/ai";
import { verifyUser } from "@/lib/auth-util";
import { getPromptConfig } from "@/lib/prompts";
import { NextResponse } from "next/server";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(req: Request) {
  try {
    const { errorResponse } = await verifyUser();
    if (errorResponse) return errorResponse;

    const { messages, subject } = (await req.json()) as {
      messages: ChatMessage[];
      subject: string;
    };

    const filtered = messages.filter((_, i) => {
      if (i === 0 && messages[0].role === "assistant") return false;
      return true;
    });

    const { systemPrompt, temperature } = await getPromptConfig(subject);

    const groqMessages = [
      { role: "system" as const, content: systemPrompt },
      ...filtered.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: groqMessages,
      max_tokens: 1024,
      temperature,
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