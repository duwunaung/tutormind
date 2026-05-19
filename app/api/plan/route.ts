import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { answers, subject } = await req.json();
    const { planType } = answers;

    const prompt = buildPrompt(answers, subject);

    const title =
      planType === "course"
        ? `${subject} Course Plan · ${answers.courseDuration}`
        : `${subject} · ${answers.topic}`;

    // Create session with the built prompt as the first user message
    const chatSession = await prisma.session.create({
      data: {
        title,
        subject,
        planType,
        messages: [{ role: "user", content: prompt }],
        userId: session.user.id,
      },
    });

    return NextResponse.json({ sessionId: chatSession.id });
  } catch (error) {
    console.error("Plan route error:", error);
    return NextResponse.json({ error: "Failed to create plan" }, { status: 500 });
  }
}

function buildPrompt(answers: any, subject: string): string {
  if (answers.planType === "course") {
    return `Create a full ${subject} course plan with the following details:
- Course title: ${answers.planTitle}
- Course duration: ${answers.courseDuration}
- Sessions per week: ${answers.sessionsPerWeek}
- Session length: ${answers.sessionLength}
- Student level: ${answers.studentLevel}
- Main goal: ${answers.goal}${answers.instructions ? `\n- Specific instructions: ${answers.instructions}` : ""}

Please generate a comprehensive course plan with sections, objectives, activities, and assessments.`;
  }

  return `Create a ${subject} lesson plan with the following details:
- Lesson title: ${answers.planTitle}
- Topic: ${answers.topic}
- Session length: ${answers.sessionLength}
- Student level: ${answers.studentLevel}
- Lesson goal: ${answers.lessonGoal}${answers.instructions ? `\n- Specific instructions: ${answers.instructions}` : ""}

Please generate a detailed lesson plan with introduction, main activity, wrap-up, and assessment.`;
}