import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local and .env (local overrides base)
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { jsonrepair } from "jsonrepair";
import { z } from "zod";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    promptTemplate: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(async ({ data }) => ({
        id: "mock-id",
        ...data,
      })),
    },
  },
}));

let groq: any;
let getPromptConfig: any;

async function loadModules() {
  if (!groq) {
    const aiModule = await import("@/lib/ai");
    groq = aiModule.groq;
    const promptsModule = await import("@/lib/prompts");
    getPromptConfig = promptsModule.getPromptConfig;
  }
}

// Determine if we should run the integration evaluations
const runEvals = process.env.RUN_AI_EVALS === "true";
const evalDescribe = runEvals ? describe : describe.skip;

// Zod schemas matching the expected JSON structures from the generators
const LessonPlanSchema = z.object({
  type: z.literal("lesson"),
  title: z.string().min(1),
  subject: z.string().min(1),
  gradeLevel: z.string().min(1),
  duration: z.string().min(1),
  objectives: z.array(z.string()).min(1),
  materials: z.array(z.string()),
  lessonStructure: z.object({
    introduction: z.object({
      duration: z.string(),
      description: z.string(),
    }),
    mainActivity: z.object({
      duration: z.string(),
      description: z.string(),
    }),
    wrapUp: z.object({
      duration: z.string(),
      description: z.string(),
    }),
  }),
  assessment: z.array(z.string()).min(1),
  homework: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const CoursePlanSchema = z.object({
  type: z.literal("course"),
  title: z.string().min(1),
  subject: z.string().min(1),
  gradeLevel: z.string().min(1),
  totalDuration: z.string().min(1),
  courseOverview: z.string().min(1),
  objectives: z.array(z.string()).min(1),
  materials: z.array(z.string()),
  sections: z.array(
    z.object({
      sectionNumber: z.number(),
      title: z.string().min(1),
      duration: z.string(),
      objectives: z.array(z.string()),
      description: z.string(),
      activities: z.string(),
      assessment: z.string(),
    })
  ).min(1),
  finalAssessment: z.string().min(1),
  notes: z.string().nullable().optional(),
});

evalDescribe("AI Evaluation Harness", () => {
  // Helper to fetch chat completion from Groq Llama 3.3 model using our prompt config
  async function getAIResponse(
    subject: string,
    messages: { role: "user" | "assistant"; content: string }[]
  ) {
    await loadModules();
    const { systemPrompt, temperature } = await getPromptConfig(subject);

    const groqMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: groqMessages,
      max_tokens: 1024,
      temperature,
    });

    return completion.choices[0]?.message?.content || "";
  }

  // Helper to simulate lesson plan generation
  async function generatePlan(chatHistory: string, isCourse: boolean, subject: string) {
    await loadModules();
    const prompt = isCourse
      ? `Based on this tutoring chat session, generate a full course plan.

CHAT SESSION:
${chatHistory}

Generate a detailed course plan in this EXACT JSON format.
IMPORTANT: You MUST calculate the exact number of session sections needed based on the "Course duration" and "Sessions per week" specified in the chat history (for example, "2 weeks" duration at "3x sessions per week" = 6 sessions). You must generate exactly that number of section objects in the "sections" array (each object representing one session). Do not generate extra sections or sessions beyond this calculated count.
IMPORTANT: In description fields, use plain text only. Do NOT use code blocks, backticks, or special characters inside string values.

{
  "type": "course",
  "title": "Course title here",
  "subject": "${subject}",
  "gradeLevel": "Grade level from context",
  "totalDuration": "Total duration (e.g. 16 hours)",
  "courseOverview": "Brief overview of the entire course",
  "objectives": ["overall objective 1", "overall objective 2", "overall objective 3"],
  "materials": ["material 1", "material 2"],
  "sections": [
    {
      "sectionNumber": 1,
      "title": "Section title",
      "duration": "1 hour",
      "objectives": ["objective 1", "objective 2"],
      "description": "What this section covers",
      "activities": "Main activities for this section",
      "assessment": "How to assess this section"
    }
  ],
  "finalAssessment": "Description of final assessment or project",
  "notes": "Any additional teaching notes"
}

IMPORTANT: Generate ALL sections as calculated. If the user asked for X sections, generate exactly X sections in the sections array.
Return ONLY the JSON object. No markdown, no backticks, no code blocks, no extra text.`
      : `Based on this tutoring chat session, generate a structured lesson plan.

CHAT SESSION:
${chatHistory}

Generate a detailed lesson plan in this EXACT JSON format.
IMPORTANT: In description fields, use plain text only. Do NOT use code blocks, backticks, or special characters inside string values.

{
  "type": "lesson",
  "title": "Lesson title here",
  "subject": "${subject}",
  "gradeLevel": "Grade level from context",
  "duration": "Estimated duration (e.g. 60 minutes)",
  "objectives": ["objective 1", "objective 2", "objective 3"],
  "materials": ["material 1", "material 2"],
  "lessonStructure": {
    "introduction": { "duration": "10 minutes", "description": "What to do in intro" },
    "mainActivity": { "duration": "35 minutes", "description": "Main teaching activity" },
    "wrapUp": { "duration": "15 minutes", "description": "How to wrap up" }
  },
  "assessment": ["assessment idea 1", "assessment idea 2"],
  "homework": "Homework description here",
  "notes": "Any additional teaching notes"
}

Return ONLY the JSON object. No markdown, no backticks, no code blocks, no extra text.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: isCourse ? 4000 : 2048,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const repaired = jsonrepair(raw);
    return JSON.parse(repaired);
  }

  describe("1. Prompt Flow and Readiness Token [READY_TO_GENERATE]", () => {
    it("should NOT output [READY_TO_GENERATE] when crucial information is missing", async () => {
      const messages = [
        { role: "user" as const, content: "I want to teach English to beginners." },
      ];
      const response = await getAIResponse("English / Language Arts", messages);
      expect(response).not.toContain("[READY_TO_GENERATE]");
    }, 60000);

    it("should output [READY_TO_GENERATE] when all required details are provided", async () => {
      const messages = [
        { role: "user" as const, content: "I want to teach English to beginners." },
        {
          role: "assistant" as const,
          content: "That's great! What specific topic within English, and how long is the lesson?",
        },
        {
          role: "user" as const,
          content:
            "I want to teach a 45-minute lesson on 'Simple Present Tense verbs'. The student level is basic beginners. The main goal is to understand how to conjugate basic verbs (run, eat, sleep) for he/she/it.",
        },
        {
          role: "assistant" as const,
          content: "Understood! Will this be a group or one-on-one lesson, and are there any specific learning activities you want to include?",
        },
        {
          role: "user" as const,
          content: "It is a one-on-one session. We will do visual matching exercises and reading practice. No other special instructions, let's start.",
        }
      ];
      const response = await getAIResponse("English / Language Arts", messages);
      expect(response).toContain("[READY_TO_GENERATE]");
    }, 60000);
  });

  describe("2. JSON Schema and Section Count Calculations", () => {
    it("should generate a valid lesson plan JSON matching the Zod schema", async () => {
      const chatHistory = `USER: Create a math lesson plan
ASSISTANT: What topic, student level, and lesson length?
USER: Topic is 'Addition of Single Digits', level is 1st grade, duration is 30 minutes, goal is basic math operations.`;

      const plan = await generatePlan(chatHistory, false, "Math");
      const validation = LessonPlanSchema.safeParse(plan);

      expect(validation.success).toBe(true);
      if (validation.success) {
        expect(validation.data.type).toBe("lesson");
        expect(validation.data.subject).toBe("Math");
      }
    }, 60000);

    it("should calculate and output the exact number of course sections requested", async () => {
      const duration = "2 weeks";
      const frequency = "3 times a week";
      const expectedSections = 6; // 2 * 3

      const chatHistory = `USER: Create a science course plan
ASSISTANT: What is the course topic, duration, frequency, and level?
USER: The topic is 'Basic Solar System study'. The course duration is ${duration} at ${frequency}. The student level is 4th grade. The goal is learning planets and orbits.`;

      const plan = await generatePlan(chatHistory, true, "Science");
      const validation = CoursePlanSchema.safeParse(plan);

      expect(validation.success).toBe(true);
      if (validation.success) {
        expect(validation.data.type).toBe("course");
        expect(validation.data.sections.length).toBe(expectedSections);
        expect(validation.data.sections[0].sectionNumber).toBe(1);
      }
    }, 60000);
  });

  describe("3. LLM-as-a-Judge Quality Assessment", () => {
    it("should generate a plan that scores at least 4/5 on educational quality", async () => {
      await loadModules();
      // Step A: Generate the plan
      const chatHistory = `USER: Create a lesson plan for Software Engineering
ASSISTANT: What is the specific coding topic, student level, and duration?
USER: Topic is 'Intro to Git and GitHub', student level is beginner (first-year college), lesson length is 60 minutes. The goal is to clone a repo, make a commit, and push it.`;

      const plan = await generatePlan(chatHistory, false, "Software Engineering");

      // Step B: Ask Groq Llama to judge it
      const evaluationPrompt = `You are an expert curriculum auditor. Rate the following generated lesson plan on a scale of 1 to 5, where:
- 5: Excellent, highly age-appropriate, detailed, has clear scaffolding and assessment.
- 4: Very good, clear and complete structure, minor refinements possible.
- 3: Good but generic, missing specific examples, or weak assessment.
- 2: Poor, disorganized, or inappropriate for the grade level.
- 1: Fails to address the goal, highly unsafe, or incomplete.

Respond in this exact JSON format:
{
  "rating": <number 1-5>,
  "reason": "your explanation here"
}

LESSON PLAN TO EVALUATE:
${JSON.stringify(plan, null, 2)}

Provide ONLY the JSON object, no markdown wrappers, no backticks.`;

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: evaluationPrompt }],
        max_tokens: 512,
        temperature: 0.1,
        response_format: { type: "json_object" },
      });

      const text = completion.choices[0]?.message?.content || "{}";
      const result = JSON.parse(text) as { rating: number; reason: string };

      console.log(`[Eval Judge Rating]: ${result.rating}/5. Reason: ${result.reason}`);
      expect(result.rating).toBeGreaterThanOrEqual(4);
    }, 60000);
  });
});
