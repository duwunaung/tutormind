import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, messages, subject } = await req.json();

    const saved = await prisma.session.create({
      data: {
        title,
        messages,
        subject,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ sessionId: saved.id });
  } catch (error) {
    console.error("Session save error:", error);
    return NextResponse.json(
      { error: "Failed to save session" },
      { status: 500 }
    );
  }
}