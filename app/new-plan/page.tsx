"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type PlanType = "course" | "lesson";

interface Answers {
  planType: PlanType | null;
  courseDuration: string;
  sessionsPerWeek: string;
  sessionLength: string;
  studentLevel: string;
  goal: string;
  topic: string;
  lessonGoal: string;
  notes: string;
}

function ChoiceButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all
        ${
          selected
            ? "bg-blue-600 text-white border-blue-600"
            : "bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-500 hover:text-white"
        }`}
    >
      {label}
    </button>
  );
}

function Choices({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <ChoiceButton
          key={o}
          label={o}
          selected={selected === o}
          onClick={() => onSelect(o)}
        />
      ))}
    </div>
  );
}

function StepWrapper({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white text-lg font-semibold">{title}</h2>
        <p className="text-gray-400 text-sm mt-1">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export default function NewPlanPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const subject = (session?.user as any)?.subject ?? "your subject";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Answers>({
    planType: null,
    courseDuration: "",
    sessionsPerWeek: "",
    sessionLength: "",
    studentLevel: "",
    goal: "",
    topic: "",
    lessonGoal: "",
    notes: "",
  });

  const set = (key: keyof Answers, value: string) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  const totalSteps = answers.planType === "course" ? 7 : 6;

  const canNext = (): boolean => {
    if (step === 1) return !!answers.planType;
    if (answers.planType === "course") {
      if (step === 2) return !!answers.courseDuration;
      if (step === 3) return !!answers.sessionsPerWeek;
      if (step === 4) return !!answers.sessionLength;
      if (step === 5) return !!answers.studentLevel;
      if (step === 6) return !!answers.goal;
    }
    if (answers.planType === "lesson") {
      if (step === 2) return !!answers.topic.trim();
      if (step === 3) return !!answers.sessionLength;
      if (step === 4) return !!answers.studentLevel;
      if (step === 5) return !!answers.lessonGoal;
    }
    return true; // notes step is optional
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, subject }),
      });
      const data = await res.json();
      if (data.sessionId) {
        router.push(`/lesson-plan/${data.sessionId}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const renderStep = () => {
    if (step === 1) {
      return (
        <StepWrapper
          title={`Let's build a ${subject} plan 👋`}
          subtitle="What would you like to create?"
        >
          <div className="flex gap-3">
            <ChoiceButton
              label="📚 Course Plan"
              selected={answers.planType === "course"}
              onClick={() => set("planType", "course")}
            />
            <ChoiceButton
              label="📝 Lesson Plan"
              selected={answers.planType === "lesson"}
              onClick={() => set("planType", "lesson")}
            />
          </div>
        </StepWrapper>
      );
    }

    // ── COURSE STEPS ──────────────────────────────────────
    if (answers.planType === "course") {
      if (step === 2)
        return (
          <StepWrapper title="How long is the course?" subtitle="Total duration">
            <Choices
              options={["1 week", "2 weeks", "1 month", "3 months", "6 months"]}
              selected={answers.courseDuration}
              onSelect={(v) => set("courseDuration", v)}
            />
          </StepWrapper>
        );

      if (step === 3)
        return (
          <StepWrapper title="Sessions per week?" subtitle="How often will you meet?">
            <Choices
              options={["1x", "2x", "3x", "5x (daily)"]}
              selected={answers.sessionsPerWeek}
              onSelect={(v) => set("sessionsPerWeek", v)}
            />
          </StepWrapper>
        );

      if (step === 4)
        return (
          <StepWrapper title="How long is each session?" subtitle="Session length">
            <Choices
              options={["30 min", "45 min", "1 hour", "1.5 hours"]}
              selected={answers.sessionLength}
              onSelect={(v) => set("sessionLength", v)}
            />
          </StepWrapper>
        );

      if (step === 5)
        return (
          <StepWrapper title="What's the student's level?" subtitle="Current level">
            <Choices
              options={["Beginner", "Intermediate", "Advanced"]}
              selected={answers.studentLevel}
              onSelect={(v) => set("studentLevel", v)}
            />
          </StepWrapper>
        );

      if (step === 6)
        return (
          <StepWrapper title="What's the main goal?" subtitle="Learning outcome">
            <Choices
              options={["Exam prep", "Fill knowledge gaps", "Get ahead", "General mastery"]}
              selected={answers.goal}
              onSelect={(v) => set("goal", v)}
            />
          </StepWrapper>
        );

      if (step === 7)
        return (
          <StepWrapper
            title="Any special notes?"
            subtitle="Optional — e.g. student has dyslexia, prefers visual learning"
          >
            <textarea
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Leave blank to skip..."
              value={answers.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </StepWrapper>
        );
    }

    // ── LESSON STEPS ──────────────────────────────────────
    if (answers.planType === "lesson") {
      if (step === 2)
        return (
          <StepWrapper
            title="What's the topic?"
            subtitle="e.g. fractions, Shakespeare, photosynthesis"
          >
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type a topic..."
              value={answers.topic}
              onChange={(e) => set("topic", e.target.value)}
            />
          </StepWrapper>
        );

      if (step === 3)
        return (
          <StepWrapper title="How long is the session?" subtitle="Session length">
            <Choices
              options={["30 min", "45 min", "1 hour"]}
              selected={answers.sessionLength}
              onSelect={(v) => set("sessionLength", v)}
            />
          </StepWrapper>
        );

      if (step === 4)
        return (
          <StepWrapper title="What's the student's level?" subtitle="Current level">
            <Choices
              options={["Beginner", "Intermediate", "Advanced"]}
              selected={answers.studentLevel}
              onSelect={(v) => set("studentLevel", v)}
            />
          </StepWrapper>
        );

      if (step === 5)
        return (
          <StepWrapper title="Goal for this lesson?" subtitle="What should the student achieve?">
            <Choices
              options={["Introduce concept", "Practice & drill", "Review & test", "Project based"]}
              selected={answers.lessonGoal}
              onSelect={(v) => set("lessonGoal", v)}
            />
          </StepWrapper>
        );

      if (step === 6)
        return (
          <StepWrapper
            title="Any special notes?"
            subtitle="Optional — e.g. student has dyslexia, prefers visual learning"
          >
            <textarea
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Leave blank to skip..."
              value={answers.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </StepWrapper>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-white font-bold text-lg">TutorMind</h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-gray-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-gray-800 transition"
          >
            ← Dashboard
          </button>
        </div>
      </div>

      {/* Interview card */}
      <div className="max-w-lg mx-auto px-6 mt-12">

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 min-h-[200px]">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-4">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
            className="text-gray-400 hover:text-white text-sm px-3 py-2 disabled:opacity-30 transition"
          >
            ← Back
          </button>

          {step < totalSteps ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white text-sm px-5 py-2 rounded-xl transition"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm px-5 py-2 rounded-xl transition font-medium"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </span>
              ) : (
                "✨ Generate Plan"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}