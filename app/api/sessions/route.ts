import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    console.log("Auth session:", session);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("Request body:", JSON.stringify(body, null, 2));

    const { title, messages, subject } = body;

    if (!title || !messages || !subject) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("Saving session for userId:", session.user.id);

    const saved = await prisma.session.create({
      data: {
        title,
        messages,
        subject,
        userId: session.user.id,
      },
    });

    console.log("Saved session:", saved);

    return NextResponse.json({ sessionId: saved.id });
  } catch (error) {
    console.error("Session save error:", error);
    return NextResponse.json(
      { error: "Something went wrong", details: String(error) },
      { status: 500 }
    );
  }
}