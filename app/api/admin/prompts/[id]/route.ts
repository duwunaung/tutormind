import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth-util";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { errorResponse } = await verifyAdmin();
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const { template, temperature } = await req.json();

    if (template === undefined && temperature === undefined) {
      return NextResponse.json({ error: "Missing fields to update" }, { status: 400 });
    }

    const data: { template?: string; temperature?: number } = {};
    if (template !== undefined) data.template = template;
    if (temperature !== undefined) {
      if (typeof temperature !== "number" || temperature < 0 || temperature > 2) {
        return NextResponse.json({ error: "Temperature must be a number between 0.0 and 2.0" }, { status: 400 });
      }
      data.temperature = temperature;
    }

    const updated = await prisma.promptTemplate.update({
      where: { id },
      data,
    });

    return NextResponse.json({ template: updated });
  } catch (error) {
    console.error("Update prompt template error:", error);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}
