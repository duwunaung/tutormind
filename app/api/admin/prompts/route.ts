import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth-util";
import { prisma } from "@/lib/prisma";
import { SUBJECT_PROMPTS } from "@/lib/prompts";
import { createAuditLog } from "@/lib/audit-logger";

export async function GET() {
  try {
    const { errorResponse } = await verifyAdmin();
    if (errorResponse) return errorResponse;

    // Fetch existing templates
    let templates = await prisma.promptTemplate.findMany({
      orderBy: { subject: "asc" },
    });

    const subjects = Object.keys(SUBJECT_PROMPTS);

    // If any subject template is missing, lazy-seed them
    const missingSubjects = subjects.filter(
      (sub) => !templates.some((t) => t.subject === sub)
    );

    if (missingSubjects.length > 0) {
      await Promise.all(
        missingSubjects.map((sub) =>
          prisma.promptTemplate.create({
            data: {
              subject: sub,
              template: SUBJECT_PROMPTS[sub],
              temperature: 0.7,
            },
          })
        )
      );

      // Re-fetch all templates
      templates = await prisma.promptTemplate.findMany({
        orderBy: { subject: "asc" },
      });
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Fetch prompt templates error:", error);
    return NextResponse.json({ error: "Failed to load templates" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { errorResponse, session } = await verifyAdmin();
    if (errorResponse || !session) return errorResponse || NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { subject, template, temperature = 0.7 } = await req.json();

    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return NextResponse.json({ error: "Subject name is required" }, { status: 400 });
    }

    if (!template || typeof template !== "string" || !template.trim()) {
      return NextResponse.json({ error: "Prompt template instructions are required" }, { status: 400 });
    }

    const tempVal = parseFloat(temperature);
    if (isNaN(tempVal) || tempVal < 0.0 || tempVal > 1.5) {
      return NextResponse.json({ error: "Temperature must be a number between 0.0 and 1.5" }, { status: 400 });
    }

    const trimmedSubject = subject.trim();

    // Check duplicate
    const existing = await prisma.promptTemplate.findUnique({
      where: { subject: trimmedSubject },
    });

    if (existing) {
      return NextResponse.json({ error: `Subject "${trimmedSubject}" already exists.` }, { status: 400 });
    }

    const newTemplate = await prisma.promptTemplate.create({
      data: {
        subject: trimmedSubject,
        template: template.trim(),
        temperature: tempVal,
      },
    });

    await createAuditLog({
      action: "PROMPT_CREATE",
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorName: session.user.name,
      targetId: newTemplate.id,
      targetName: newTemplate.subject,
      details: {
        subject: newTemplate.subject,
        temperature: newTemplate.temperature,
      },
    });

    return NextResponse.json({ template: newTemplate }, { status: 201 });
  } catch (error) {
    console.error("Create prompt template error:", error);
    return NextResponse.json({ error: "Failed to create subject template" }, { status: 500 });
  }
}
