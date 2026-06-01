import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/auth-util";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyUser();
    if (authResult.errorResponse) return authResult.errorResponse;
    const { session } = authResult;

    const { id } = await params;
    const { isShared } = await req.json();

    const lessonPlan = await prisma.lessonPlan.findUnique({
      where: { id },
    });

    if (!lessonPlan) {
      return NextResponse.json({ error: "Lesson plan not found" }, { status: 404 });
    }

    if (lessonPlan.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const structure = (lessonPlan.structure || {}) as any;
    structure.isShared = !!isShared;

    const updated = await prisma.lessonPlan.update({
      where: { id },
      data: {
        structure,
      },
    });

    return NextResponse.json({ lessonPlan: updated });
  } catch (error) {
    console.error("Toggle share error:", error);
    return NextResponse.json(
      { error: "Failed to update sharing settings" },
      { status: 500 }
    );
  }
}
