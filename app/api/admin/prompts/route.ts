import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth-util";
import { prisma } from "@/lib/prisma";
import { SUBJECT_PROMPTS } from "@/lib/prompts";

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
