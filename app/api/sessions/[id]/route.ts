import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/auth-util";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }  // ← Promise
) {
  try {
    const authResult = await verifyUser();
    if (authResult.errorResponse) return authResult.errorResponse;
    const { session } = authResult;

    const { id } = await params;  // ← await params

    const chatSession = await prisma.session.findUnique({
      where: { id },              // ← use destructured id
      include: { lessonPlan: true },
    });

    if (!chatSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (chatSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (chatSession.lessonPlan?.blobUrl) {
      try {
        await del(chatSession.lessonPlan.blobUrl);
      } catch (e) {
        console.error("Blob delete failed:", e);
      }
    }

    if (chatSession.lessonPlan) {
      await prisma.lessonPlan.delete({
        where: { id: chatSession.lessonPlan.id },
      });
    }

    await prisma.session.delete({
      where: { id },              // ← use destructured id
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete session error:", error);
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyUser();
    if (authResult.errorResponse) return authResult.errorResponse;
    const { session } = authResult;

    const { id } = await params;

    const chatSession = await prisma.session.findUnique({
      where: { id },
    });

    if (!chatSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (chatSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ session: chatSession });
  } catch (error) {
    console.error("Get session error:", error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyUser();
    if (authResult.errorResponse) return authResult.errorResponse;
    const { session } = authResult;

    const { id } = await params;
    const { messages } = await req.json();

    if (!messages) {
      return NextResponse.json({ error: "Missing messages parameter" }, { status: 400 });
    }

    const chatSession = await prisma.session.findUnique({
      where: { id },
    });

    if (!chatSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (chatSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.session.update({
      where: { id },
      data: { messages },
    });

    return NextResponse.json({ session: updated });
  } catch (error) {
    console.error("Update session error:", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}