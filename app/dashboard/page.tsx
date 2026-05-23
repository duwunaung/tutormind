"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AppHeader from "@/app/components/AppHeader";
import AppFooter from "@/app/components/AppFooter";

type LessonPlan = {
  id: string;
  blobUrl: string | null;
};

type ChatSession = {
  id: string;
  title: string;
  subject: string;
  planType: string;
  createdAt: string;
  lessonPlan: LessonPlan | null;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role === "admin") {
      router.push("/admin");
    }
  }, [status, session, router]);

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
      if (!res.ok) { alert("Failed to generate file."); return; }
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

  const handleDelete = async (sessionId: string) => {
    setDeleting(sessionId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (!res.ok) { alert("Failed to delete session."); return; }
      // Remove from local state — no page reload needed
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setConfirmingDelete(null);
    } catch (err) {
      console.error("Delete error:", err);
      alert("Something went wrong.");
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const totalSessions = sessions.length;
  const totalPlans = sessions.filter((s) => s.lessonPlan).length;
  const totalCourses = sessions.filter((s) => s.lessonPlan && s.planType === "course").length;
  const totalLessons = sessions.filter((s) => s.lessonPlan && s.planType === "lesson").length;

  const userSubject = (session?.user as { subject?: string })?.subject || "General";
  const userGrade = (session?.user as { gradeLevel?: string })?.gradeLevel || "All Levels";

  const stats = [
    {
      title: "Plans Generated",
      value: totalPlans,
      desc: `${totalLessons} Lessons · ${totalCourses} Courses`,
      color: "text-purple-400 border-purple-500/20 bg-purple-500/5",
      icon: "✨",
    },
    {
      title: "Chat Sessions",
      value: totalSessions,
      desc: "Total planning history",
      color: "text-blue-400 border-blue-500/20 bg-blue-500/5",
      icon: "💬",
    },
    {
      title: "Saved Courses",
      value: totalCourses,
      desc: "Curriculums generated",
      color: "text-indigo-400 border-indigo-500/20 bg-indigo-500/5",
      icon: "📘",
    },
    {
      title: "Tutor Specialty",
      value: userSubject,
      desc: userGrade,
      color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
      icon: "🎓",
    },
  ];

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <AppHeader />

      <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 flex flex-col justify-start">

        {/* Welcome + New Session */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Welcome back, {session?.user?.name?.split(" ")[0]}! 👋
            </h2>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              {sessions.length === 0
                ? "Start your first session to get going"
                : `You have ${sessions.length} session${sessions.length > 1 ? "s" : ""} so far`}
            </p>
          </div>
          <button
            onClick={() => router.push("/new-plan")}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition duration-200 w-full sm:w-auto text-center cursor-pointer shadow-lg shadow-blue-600/15"
          >
            + New Plan
          </button>
        </div>

        {/* Tutor Analytics Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex flex-col justify-between h-28 hover:border-gray-700 transition duration-200 select-none"
            >
              <div className="flex justify-between items-start">
                <span className="text-gray-400 text-xs font-semibold">{stat.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${stat.color} font-medium tracking-wide flex items-center gap-1`}>
                  <span>{stat.icon}</span>
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-lg sm:text-2xl font-bold tracking-tight text-white mt-1.5 truncate" title={String(stat.value)}>
                  {stat.value}
                </div>
                <div className="text-[10px] text-gray-500 mt-1 truncate" title={stat.desc}>
                  {stat.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 sm:p-12 text-center flex-1 flex flex-col items-center justify-center min-h-[300px]">
            <p className="text-4xl mb-4 select-none">📚</p>
            <p className="text-white font-semibold mb-1">No sessions yet</p>
            <p className="text-gray-400 text-xs sm:text-sm mb-6">
              Create a plan to get started
            </p>
            <button
              onClick={() => router.push("/new-plan")}
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-sm font-medium transition cursor-pointer"
            >
              + New Plan
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between hover:border-gray-700 transition gap-4"
              >
                {/* Session Info */}
                <div className="flex-1 min-w-0 w-full">
                  <p className="text-white text-sm font-semibold truncate" title={s.title}>{s.title}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs text-gray-500">
                    <span>{s.subject}</span>
                    <span className="text-gray-700 font-bold select-none">·</span>
                    <span>{formatDate(s.createdAt)}</span>
                    {s.lessonPlan && (
                      <>
                        <span className="text-gray-700 font-bold select-none">·</span>
                        <span className="text-green-500 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          Plan ready
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 sm:ml-4 shrink-0 items-center w-full sm:w-auto justify-start sm:justify-end border-t border-gray-800/50 pt-3 sm:pt-0 sm:border-0">
                  {s.lessonPlan && (
                    <>
                      <button
                        onClick={() => router.push(`/lesson-plan/${s.id}`)}
                        className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-3.5 py-2 sm:py-1.5 rounded-lg transition font-medium flex-1 sm:flex-none text-center cursor-pointer"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDownload(s.lessonPlan!.id)}
                        disabled={downloading === s.lessonPlan.id}
                        className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs px-3.5 py-2 sm:py-1.5 rounded-lg transition font-semibold flex-1 sm:flex-none text-center cursor-pointer"
                      >
                        {downloading === s.lessonPlan.id ? "..." : "⬇ DOCX"}
                      </button>
                    </>
                  )}

                  {/* Delete — inline confirmation */}
                  {confirmingDelete === s.id ? (
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={deleting === s.id}
                        className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs px-3 py-2 sm:py-1.5 rounded-lg transition flex-1 sm:flex-none text-center font-medium cursor-pointer"
                      >
                        {deleting === s.id ? "..." : "Confirm Delete?"}
                      </button>
                      <button
                        onClick={() => setConfirmingDelete(null)}
                        className="text-gray-400 hover:text-white text-xs px-3 py-2 sm:py-1.5 transition font-medium cursor-pointer text-center"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmingDelete(s.id)}
                      className="bg-gray-850 hover:bg-red-500/10 hover:text-red-400 text-gray-500 text-xs px-3 py-2 sm:py-1.5 rounded-lg transition flex-1 sm:flex-none text-center border border-transparent hover:border-red-500/10 font-medium cursor-pointer"
                    >
                      🗑 Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AppFooter />
    </div>
  );
}