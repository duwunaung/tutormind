import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth-util";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit-logger";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { errorResponse, session } = await verifyAdmin();
    if (errorResponse || !session) return errorResponse || NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { template, temperature } = await req.json();

    if (template === undefined && temperature === undefined) {
      return NextResponse.json({ error: "Missing fields to update" }, { status: 400 });
    }

    const oldTemplate = await prisma.promptTemplate.findUnique({
      where: { id },
    });

    if (!oldTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
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

    const changedFields: string[] = [];
    if (template !== undefined && template !== oldTemplate.template) changedFields.push("template");
    if (temperature !== undefined && temperature !== oldTemplate.temperature) changedFields.push("temperature");

    if (changedFields.length > 0) {
      await createAuditLog({
        action: "PROMPT_UPDATE",
        actorId: session.user.id,
        actorEmail: session.user.email,
        actorName: session.user.name,
        targetId: updated.id,
        targetName: updated.subject,
        details: {
          subject: updated.subject,
          changedFields,
          oldTemperature: oldTemplate.temperature,
          newTemperature: updated.temperature,
        },
      });
    }

    return NextResponse.json({ template: updated });
  } catch (error) {
    console.error("Update prompt template error:", error);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}
