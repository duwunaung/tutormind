"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AppHeader from "@/app/components/AppHeader";

type PlanType = "course" | "lesson";
type Mode = "pick" | "wizard";

interface Answers {
  planType: PlanType | null;
  // course
  courseDuration: string;
  courseDurationCustom: string;
  sessionsPerWeek: string;
  sessionsPerWeekCustom: string;
  // shared
  sessionLength: string;
  sessionLengthCustom: string;
  studentLevel: string;
  goal: string;
  planTitle: string;
  instructions: string;
  // lesson
  topic: string;
  lessonGoal: string;
  notes: string;
}

// ── Reusable components ───────────────────────────────────────────────

function ChoiceButton({
  label, selected, onClick,
}: {
  label: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all
        ${selected
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-500 hover:text-white"
        }`}
    >
      {label}
    </button>
  );
}

function ChoicesWithOther({
  options, selected, customValue, onSelect, onCustomChange, placeholder,
}: {
  options: string[];
  selected: string;
  customValue: string;
  onSelect: (v: string) => void;
  onCustomChange: (v: string) => void;
  placeholder: string;
}) {
  const isOther = selected === "other";
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <ChoiceButton key={o} label={o} selected={selected === o} onClick={() => onSelect(o)} />
        ))}
        <ChoiceButton label="✏️ Other" selected={isOther} onClick={() => onSelect("other")} />
      </div>
      {isOther && (
        <input
          autoFocus
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={placeholder}
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
        />
      )}
    </div>
  );
}

function StepWrapper({
  title, subtitle, children,
}: {
  title: string; subtitle: string; children: React.ReactNode;
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

// ── Main component ────────────────────────────────────────────────────

export default function NewPlanPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as { subject?: string } | undefined;
  const subject = user?.subject ?? "your subject";

  const [mode, setMode] = useState<Mode>("pick");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Answers>({
    planType: null,
    courseDuration: "",
    courseDurationCustom: "",
    sessionsPerWeek: "",
    sessionsPerWeekCustom: "",
    sessionLength: "",
    sessionLengthCustom: "",
    studentLevel: "",
    goal: "",
    planTitle: "",
    instructions: "",
    topic: "",
    lessonGoal: "",
    notes: "",
  });

  const set = (key: keyof Answers, value: string) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  const totalSteps = answers.planType === "course" ? 8 : 7;

  const resolved = useMemo(() => ({
    courseDuration: answers.courseDuration === "other" ? answers.courseDurationCustom : answers.courseDuration,
    sessionsPerWeek: answers.sessionsPerWeek === "other" ? answers.sessionsPerWeekCustom : answers.sessionsPerWeek,
    sessionLength: answers.sessionLength === "other" ? answers.sessionLengthCustom : answers.sessionLength,
  }), [answers.courseDuration, answers.courseDurationCustom, answers.sessionsPerWeek, answers.sessionsPerWeekCustom, answers.sessionLength, answers.sessionLengthCustom]);

  const canNext = useCallback((): boolean => {
    if (step === 1) return !!answers.planType;
    if (answers.planType === "course") {
      if (step === 2) return !!resolved.courseDuration.trim();
      if (step === 3) return !!resolved.sessionsPerWeek.trim();
      if (step === 4) return !!resolved.sessionLength.trim();
      if (step === 5) return !!answers.studentLevel;
      if (step === 6) return !!answers.goal;
      if (step === 7) return !!answers.planTitle.trim();
      if (step === 8) return true;
    }
    if (answers.planType === "lesson") {
      if (step === 2) return !!answers.topic.trim();
      if (step === 3) return !!resolved.sessionLength.trim();
      if (step === 4) return !!answers.studentLevel;
      if (step === 5) return !!answers.lessonGoal;
      if (step === 6) return !!answers.planTitle.trim();
      if (step === 7) return true;
    }
    return true;
  }, [step, answers, resolved]);

  const handleGenerate = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: { ...answers, ...resolved }, subject }),
      });
      const data = await res.json();
      if (data.sessionId) router.push(`/lesson-plan/${data.sessionId}`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [loading, answers, resolved, subject, router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role === "admin") {
      router.push("/admin");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (mode !== "wizard") return; // don't intercept on pick screen
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
      if (e.key === "Enter" && canNext()) {
        if (step < totalSteps) setStep((s) => s + 1);
        else handleGenerate();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, totalSteps, mode, canNext, handleGenerate]);
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Step renderer ─────────────────────────────────────────────────
  const renderStep = () => {
    if (step === 1) {
      return (
        <StepWrapper title={`Let's build a ${subject} plan 👋`} subtitle="What would you like to create?">
          <div className="flex gap-3">
            <ChoiceButton label="📚 Course Plan" selected={answers.planType === "course"} onClick={() => set("planType", "course")} />
            <ChoiceButton label="📝 Lesson Plan" selected={answers.planType === "lesson"} onClick={() => set("planType", "lesson")} />
          </div>
        </StepWrapper>
      );
    }

    if (answers.planType === "course") {
      if (step === 2) return (
        <StepWrapper title="How long is the course?" subtitle="Total duration">
          <ChoicesWithOther options={["1 week", "2 weeks", "1 month", "3 months", "6 months"]} selected={answers.courseDuration} customValue={answers.courseDurationCustom} onSelect={(v) => set("courseDuration", v)} onCustomChange={(v) => set("courseDurationCustom", v)} placeholder="e.g. 2 months, 10 weeks..." />
        </StepWrapper>
      );
      if (step === 3) return (
        <StepWrapper title="Sessions per week?" subtitle="How often will you meet?">
          <ChoicesWithOther options={["1x", "2x", "3x", "5x (daily)"]} selected={answers.sessionsPerWeek} customValue={answers.sessionsPerWeekCustom} onSelect={(v) => set("sessionsPerWeek", v)} onCustomChange={(v) => set("sessionsPerWeekCustom", v)} placeholder="e.g. 4x, every other day..." />
        </StepWrapper>
      );
      if (step === 4) return (
        <StepWrapper title="How long is each session?" subtitle="Session length">
          <ChoicesWithOther options={["30 min", "45 min", "1 hour", "1.5 hours"]} selected={answers.sessionLength} customValue={answers.sessionLengthCustom} onSelect={(v) => set("sessionLength", v)} onCustomChange={(v) => set("sessionLengthCustom", v)} placeholder="e.g. 2 hours, 20 min..." />
        </StepWrapper>
      );
      if (step === 5) return (
        <StepWrapper title="What's the student's level?" subtitle="Current level">
          <div className="flex flex-wrap gap-2">
            {["Beginner", "Intermediate", "Advanced"].map((o) => (
              <ChoiceButton key={o} label={o} selected={answers.studentLevel === o} onClick={() => set("studentLevel", o)} />
            ))}
          </div>
        </StepWrapper>
      );
      if (step === 6) return (
        <StepWrapper title="What's the main goal?" subtitle="Learning outcome">
          <div className="flex flex-wrap gap-2">
            {["Exam prep", "Fill knowledge gaps", "Get ahead", "General mastery"].map((o) => (
              <ChoiceButton key={o} label={o} selected={answers.goal === o} onClick={() => set("goal", o)} />
            ))}
          </div>
        </StepWrapper>
      );
      if (step === 7) return (
        <StepWrapper title="What's the course title?" subtitle="Give your course a name — e.g. Logic First Python, Python for Data Mastery">
          <input autoFocus className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Logic First Python" value={answers.planTitle} onChange={(e) => set("planTitle", e.target.value)} />
        </StepWrapper>
      );
      if (step === 8) return (
        <StepWrapper title="Any specific instructions?" subtitle="Optional — e.g. OOP must include, API not included, student has dyslexia">
          <textarea className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" rows={4} placeholder="Leave blank to skip..." value={answers.instructions} onChange={(e) => set("instructions", e.target.value)} />
        </StepWrapper>
      );
    }

    if (answers.planType === "lesson") {
      if (step === 2) return (
        <StepWrapper title="What's the topic?" subtitle="e.g. fractions, Shakespeare, photosynthesis">
          <input autoFocus className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Type a topic..." value={answers.topic} onChange={(e) => set("topic", e.target.value)} />
        </StepWrapper>
      );
      if (step === 3) return (
        <StepWrapper title="How long is the session?" subtitle="Session length">
          <ChoicesWithOther options={["30 min", "45 min", "1 hour"]} selected={answers.sessionLength} customValue={answers.sessionLengthCustom} onSelect={(v) => set("sessionLength", v)} onCustomChange={(v) => set("sessionLengthCustom", v)} placeholder="e.g. 1.5 hours, 20 min..." />
        </StepWrapper>
      );
      if (step === 4) return (
        <StepWrapper title="What's the student's level?" subtitle="Current level">
          <div className="flex flex-wrap gap-2">
            {["Beginner", "Intermediate", "Advanced"].map((o) => (
              <ChoiceButton key={o} label={o} selected={answers.studentLevel === o} onClick={() => set("studentLevel", o)} />
            ))}
          </div>
        </StepWrapper>
      );
      if (step === 5) return (
        <StepWrapper title="Goal for this lesson?" subtitle="What should the student achieve?">
          <div className="flex flex-wrap gap-2">
            {["Introduce concept", "Practice & drill", "Review & test", "Project based"].map((o) => (
              <ChoiceButton key={o} label={o} selected={answers.lessonGoal === o} onClick={() => set("lessonGoal", o)} />
            ))}
          </div>
        </StepWrapper>
      );
      if (step === 6) return (
        <StepWrapper title="What's the lesson title?" subtitle="Give your lesson a name — e.g. Intro to Loops, Understanding Shakespeare's Sonnets">
          <input autoFocus className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Intro to Loops" value={answers.planTitle} onChange={(e) => set("planTitle", e.target.value)} />
        </StepWrapper>
      );
      if (step === 7) return (
        <StepWrapper title="Any specific instructions?" subtitle="Optional — e.g. focus on real-world examples, no theory heavy content">
          <textarea className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" rows={4} placeholder="Leave blank to skip..." value={answers.instructions} onChange={(e) => set("instructions", e.target.value)} />
        </StepWrapper>
      );
    }
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <AppHeader mode="wizard" />


      <div className="max-w-lg mx-auto px-6 mt-12">
        {mode === "pick" ? (
          /* ── Mode picker ── */
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-white text-xl font-semibold">How would you like to create your plan?</h2>
              <p className="text-gray-400 text-sm mt-2">Choose the style that works best for you</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setMode("wizard")}
                className="bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-blue-500 rounded-2xl p-6 text-left transition-all group"
              >
                <div className="text-3xl mb-3">🧙</div>
                <h3 className="text-white font-semibold mb-1">Wizard</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Step-by-step guided questions. Best if you want structure and quick results.
                </p>
                <div className="mt-4 text-blue-400 text-xs font-medium group-hover:text-blue-300">
                  Start wizard →
                </div>
              </button>

              <button
                onClick={() => router.push("/chat")}
                className="bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-blue-500 rounded-2xl p-6 text-left transition-all group"
              >
                <div className="text-3xl mb-3">💬</div>
                <h3 className="text-white font-semibold mb-1">Chat</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Free-form conversation. Best if you prefer to describe things naturally.
                </p>
                <div className="mt-4 text-blue-400 text-xs font-medium group-hover:text-blue-300">
                  Open chat →
                </div>
              </button>
            </div>
          </div>

        ) : (
          /* ── Wizard ── */
          <>
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

            {/* Step card */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 min-h-[220px]">
              {renderStep()}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => step === 1 ? setMode("pick") : setStep((s) => s - 1)}
                className="text-gray-400 hover:text-white text-sm px-3 py-2 transition"
              >
                ← Back
              </button>

              {canNext() && step < totalSteps && (
                <span className="text-gray-600 text-xs">press Enter ↵</span>
              )}

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
                  ) : "✨ Generate Plan"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}