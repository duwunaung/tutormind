"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AppHeader from "@/app/components/AppHeader";
import AppFooter from "@/app/components/AppFooter";

type SparkResult = {
  hook: string;
  game: string;
  analogy: string;
};

export default function SparkPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Load current user context
  const user = session?.user as { subject?: string; gradeLevel?: string } | undefined;

  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");

  const [generating, setGenerating] = useState(false);
  const [spark, setSpark] = useState<SparkResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creatingPlan, setCreatingPlan] = useState(false);

  // Set default subject and grade level from session
  useEffect(() => {
    if (user?.subject) {
      setSubject(user.subject);
    } else {
      setSubject("Math"); // fallback default
    }
    if (user?.gradeLevel) {
      setGradeLevel(user.gradeLevel);
    } else {
      setGradeLevel("High School"); // fallback default
    }
  }, [user]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role === "admin") {
      router.push("/admin");
    }
  }, [status, session, router]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setGenerating(true);
    setError(null);
    setSpark(null);

    try {
      const res = await fetch("/api/spark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          subject,
          gradeLevel,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate ideas");
      }

      setSpark(data.spark);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!spark || !topic.trim()) return;
    setCreatingPlan(true);

    try {
      const promptText = `I want to create a lesson plan for the topic: "${topic.trim()}" inside the subject "${subject}" for ${gradeLevel} students. To help spark engagement, here are some generated ideas:

1. Hook: ${spark.hook}
2. Game: ${spark.game}
3. Analogy: ${spark.analogy}

Please use these ideas as inspiration to build the lesson plan.`;

      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Spark Plan: ${topic.trim()}`,
          messages: [{ role: "user", content: promptText }],
          subject: subject,
          planType: "lesson",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create session");
      }

      const data = await response.json();
      router.push(`/chat?session=${data.sessionId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to initialize lesson plan session.");
    } finally {
      setCreatingPlan(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <AppHeader />

      <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-12 flex-1 flex flex-col justify-start">
        {/* Title Block */}
        <div className="mb-8 text-center sm:text-left">
          <span className="text-blue-500 font-bold text-xs uppercase tracking-wider">Engagement Generator</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            ⚡ AI Spark Sandbox
          </h2>
          <p className="text-gray-400 text-sm mt-2 max-w-xl">
            Stuck on how to introduce a topic? Generate custom-targeted hooks, interactive games, and analogies to bring your lessons to life.
          </p>
        </div>

        {/* Input Form Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-xl shadow-blue-500/5 mb-8">
          <form onSubmit={handleGenerate} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Subject Select */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-400">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Math">Math</option>
                  <option value="Science">Science</option>
                  <option value="English / Language Arts">English / Language Arts</option>
                  <option value="History">History</option>
                  <option value="Software Engineering">Software Engineering</option>
                </select>
              </div>

              {/* Grade Level Select */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-400">Grade Level</label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Grade 1-5">Grade 1-5</option>
                  <option value="Grade 6-8">Grade 6-8</option>
                  <option value="High School">High School</option>
                  <option value="College">College</option>
                </select>
              </div>
            </div>

            {/* Topic Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-400">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Photosynthesis, Fractions, Shakespeare's Hamlet, Python Functions..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={generating || !topic.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 cursor-pointer shadow-lg shadow-blue-600/10 flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating Spark Ideas...
                </>
              ) : (
                <>
                  <span>⚡</span> Generate Spark Ideas
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-4 mb-8">
            ⚠️ {error}
          </div>
        )}

        {/* Results Block */}
        {spark && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>💡</span> Engaged Sparks for "{topic}"
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Hook Card */}
              <div className="bg-gray-900 border border-gray-800/80 rounded-xl p-5 hover:border-blue-500/30 transition-all flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🎣</span>
                  <h4 className="text-sm font-bold text-white tracking-tight">The Hook</h4>
                </div>
                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed flex-1">
                  {spark.hook}
                </p>
              </div>

              {/* Game Card */}
              <div className="bg-gray-900 border border-gray-800/80 rounded-xl p-5 hover:border-emerald-500/30 transition-all flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🎮</span>
                  <h4 className="text-sm font-bold text-white tracking-tight">The Game</h4>
                </div>
                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed flex-1">
                  {spark.game}
                </p>
              </div>

              {/* Analogy Card */}
              <div className="bg-gray-900 border border-gray-800/80 rounded-xl p-5 hover:border-amber-500/30 transition-all flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">💡</span>
                  <h4 className="text-sm font-bold text-white tracking-tight">The Analogy</h4>
                </div>
                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed flex-1">
                  {spark.analogy}
                </p>
              </div>
            </div>

            {/* Actions Block */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-blue-600/5 border border-blue-500/10 rounded-xl p-4 sm:p-5 mt-4">
              <div className="flex-1 text-center sm:text-left">
                <h4 className="text-white text-sm font-bold">Love these ideas?</h4>
                <p className="text-gray-400 text-xs mt-1">
                  Create a full, customized lesson plan around this spark in the planning workspace.
                </p>
              </div>
              <button
                onClick={handleCreatePlan}
                disabled={creatingPlan}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all duration-200 cursor-pointer shadow-md shadow-blue-600/20 flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                {creatingPlan ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Initializing Chat...
                  </>
                ) : (
                  <>
                    <span>⚡</span> Create Lesson Plan
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <AppFooter />
    </div>
  );
}
