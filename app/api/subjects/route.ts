import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const templates = await prisma.promptTemplate.findMany({
      select: { subject: true },
      orderBy: { subject: "asc" },
    });

    const subjects = templates.map((t) => t.subject);

    return NextResponse.json({ subjects });
  } catch (error) {
    console.error("Fetch subjects error:", error);
    // Return an error but allow the client to handle it gracefully
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 });
  }
}
