import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }  // ← Promise
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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