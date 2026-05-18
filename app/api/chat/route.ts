import Groq from "groq-sdk";
import { auth } from "@/auth";
import { getSystemPrompt } from "@/lib/prompts";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, subject } = await req.json();

    // Filter out welcome message and build history
    const filtered = messages.filter((_: any, i: number) => {
      if (i === 0 && messages[0].role === "assistant") return false;
      return true;
    });

    // Build Groq message format
    const groqMessages = [
      {
        role: "system" as const,
        content: getSystemPrompt(subject),
      },
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

    const text = completion.choices[0]?.message?.content || "";

    return NextResponse.json({ message: text });
  } catch (error) {
    console.error("Groq error:", error);
    return NextResponse.json(
      { error: "Failed to get AI response" },
      { status: 500 }
    );
  }
}