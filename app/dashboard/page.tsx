"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

type LessonPlan = {
  id: string;
  blobUrl: string | null;
};

type ChatSession = {
  id: string;
  title: string;
  subject: string;
  createdAt: string;
  lessonPlan: LessonPlan | null;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchSessions = async () => {
      try {
        const res = await fetch("/api/dashboard");
        const data = await res.json();
        setSessions(data.sessions || []);
      } catch (err) {
        console.error("Failed to load sessions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [status]);

  const handleDownload = async (lessonPlanId: string) => {
    setDownloading(lessonPlanId);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonPlanId, format: "docx" }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert("Failed to generate file.");
        return;
      }

      const link = document.createElement("a");
      link.href = data.url;
      link.download = "lesson-plan.docx";
      link.click();
    } catch (err) {
      console.error("Download error:", err);
      alert("Something went wrong.");
    } finally {
      setDownloading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-lg">TutorMind</h1>
            <p className="text-gray-400 text-xs">
              {(session?.user as any)?.subject} · {(session?.user as any)?.gradeLevel}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">{session?.user?.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-gray-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-gray-800 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Welcome + New Session */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Welcome back, {session?.user?.name?.split(" ")[0]}! 👋
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {sessions.length === 0
                ? "Start your first session to get going"
                : `You have ${sessions.length} session${sessions.length > 1 ? "s" : ""} so far`}
            </p>
          </div>
          <button
            onClick={() => router.push("/new-plan")}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition"
          >
            + New Session
          </button>
        </div>

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
            <p className="text-4xl mb-4">📚</p>
            <p className="text-white font-medium mb-1">No sessions yet</p>
            <p className="text-gray-400 text-sm mb-6">
              Start a chat session to plan your first lesson
            </p>
            <button
              onClick={() => router.push("/new-plan")}
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-sm transition"
            >
              + Start New Session
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between hover:border-gray-700 transition"
              >
                {/* Session Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {s.title}
                  </p>
                  <div className="flex gap-3 mt-1">
                    <span className="text-gray-500 text-xs">{s.subject}</span>
                    <span className="text-gray-600 text-xs">·</span>
                    <span className="text-gray-500 text-xs">
                      {formatDate(s.createdAt)}
                    </span>
                    {s.lessonPlan && (
                      <>
                        <span className="text-gray-600 text-xs">·</span>
                        <span className="text-green-500 text-xs">
                          ✓ Lesson plan ready
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 ml-4 shrink-0">
                  {s.lessonPlan && (
                    <>
                      <button
                        onClick={() => router.push(`/lesson-plan/${s.id}`)}
                        className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-3 py-1.5 rounded-lg transition"
                      >
                        View Plan
                      </button>
                      <button
                        onClick={() => handleDownload(s.lessonPlan!.id)}
                        disabled={downloading === s.lessonPlan.id}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg transition"
                      >
                        {downloading === s.lessonPlan.id ? "..." : "⬇ DOCX"}
                      </button>
                    </>
                  )}
                  {!s.lessonPlan && (
                    <span className="text-gray-600 text-xs px-3 py-1.5">
                      No plan yet
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}