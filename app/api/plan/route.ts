import { verifyUser } from "@/lib/auth-util";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const authResult = await verifyUser();
    if (authResult.errorResponse) return authResult.errorResponse;
    const { session } = authResult;

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

interface Answers {
  planType: string;
  planTitle?: string;
  courseDuration?: string;
  sessionsPerWeek?: string;
  sessionLength?: string;
  studentLevel?: string;
  goal?: string;
  instructions?: string;
  topic?: string;
  lessonGoal?: string;
}

function buildPrompt(answers: Answers, subject: string): string {
  if (answers.planType === "course") {
    return `Create a full ${subject} course plan with the following details:
- Course title: ${answers.planTitle}
- Course duration: ${answers.courseDuration}
- Sessions per week: ${answers.sessionsPerWeek}
- Session length: ${answers.sessionLength}
- Student level: ${answers.studentLevel}
- Main goal: ${answers.goal}${answers.instructions ? `\n- Specific instructions: ${answers.instructions}` : ""}

CONTENT SAFETY RULES:
- ALL content MUST be age-appropriate for ${answers.studentLevel || "the specified grade level"} students.
- NEVER include violent, disturbing, scary, or traumatic scenarios.
- Use only safe, positive, classroom-appropriate content.
- Materials suggested must be real, classroom-feasible items.

PEDAGOGICAL QUALITY RULES:
- Include DIFFERENTIATION: strategies for struggling students AND extension for advanced learners.
- Use CONCRETE, SPECIFIC examples — name actual topics, problems, or activities.
- Structure learning PROGRESSIVELY: build from foundation to application.
- Include SCAFFOLDING: break complex skills into smaller steps.
- Every activity should have a clear PURPOSE tied to the learning objective.

Please generate a comprehensive course plan with sections, objectives, activities, and assessments.`;
  }

  return `Create a ${subject} lesson plan with the following details:
- Lesson title: ${answers.planTitle}
- Topic: ${answers.topic}
- Session length: ${answers.sessionLength}
- Student level: ${answers.studentLevel}
- Lesson goal: ${answers.lessonGoal}${answers.instructions ? `\n- Specific instructions: ${answers.instructions}` : ""}

CONTENT SAFETY RULES:
- ALL content MUST be age-appropriate for ${answers.studentLevel || "the specified grade level"} students.
- NEVER include violent, disturbing, scary, or traumatic scenarios.
- Use only safe, positive, classroom-appropriate content.
- Materials suggested must be real, classroom-feasible items.

PEDAGOGICAL QUALITY RULES:
- Include DIFFERENTIATION: strategies for struggling students AND extension for advanced learners.
- Use CONCRETE, SPECIFIC examples — name actual topics, problems, or activities.
- Structure learning PROGRESSIVELY: introduction sets foundation, main activity builds, wrap-up reinforces.
- Include SCAFFOLDING: break complex skills into smaller steps.
- Every activity should have a clear PURPOSE tied to the learning objective.

Please generate a detailed lesson plan with introduction, main activity, wrap-up, and assessment.`;
}