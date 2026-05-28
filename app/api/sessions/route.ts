import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/auth-util";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const authResult = await verifyUser();
    if (authResult.errorResponse) return authResult.errorResponse;
    const { session } = authResult;

    const body = await req.json();
    

    const { title, messages, subject, planType } = body;

    if (!title || !messages || !subject) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    

    const saved = await prisma.session.create({
      data: {
        title,
        messages,
        subject,
        planType: planType || "lesson",
        userId: session.user.id,
      },
    });

    

    return NextResponse.json({ sessionId: saved.id });
  } catch (error) {
    console.error("Session save error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}