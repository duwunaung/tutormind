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

type ChatMessage = {
  role: string;
  content: string;
  ready?: boolean;
};

type ChatSession = {
  id: string;
  title: string;
  subject: string;
  planType: string;
  createdAt: string;
  messages: ChatMessage[];
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
  const [activeFilter, setActiveFilter] = useState<"all" | "plans" | "lessons" | "courses" | "in_progress">("all");

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");


  const handleRenameSubmit = async (sessionId: string) => {
    if (!renameValue.trim()) return;
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: renameValue.trim() }),
      });
      if (!res.ok) {
        alert("Failed to rename session.");
        return;
      }
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title: renameValue.trim() } : s))
      );
      setRenamingId(null);
    } catch (err) {
      console.error("Rename error:", err);
      alert("Something went wrong.");
    }
  };

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
  const totalInProgress = totalSessions - totalPlans;

  const isReadyToGenerate = (s: ChatSession) => {
    const msgs = s.messages;
    if (!Array.isArray(msgs) || msgs.length === 0) return false;
    if (msgs[0].role === "user") return true; // Wizard session
    return msgs.some((m) => m.role === "assistant" && m.ready === true);
  };

  const stats = [
    {
      id: "plans" as const,
      title: "Plans Generated",
      value: totalPlans,
      desc: `${totalLessons} Lessons · ${totalCourses} Courses`,
      color: "text-purple-400 border-purple-500/20 bg-purple-500/5",
      icon: "✨",
    },
    {
      id: "all" as const,
      title: "Chat Sessions",
      value: totalSessions,
      desc: "Total planning history",
      color: "text-blue-400 border-blue-500/20 bg-blue-500/5",
      icon: "💬",
    },
  ];

  const filteredSessions = sessions.filter((s) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "plans") return s.lessonPlan !== null;
    if (activeFilter === "lessons") return s.planType === "lesson" && s.lessonPlan !== null;
    if (activeFilter === "courses") return s.planType === "course" && s.lessonPlan !== null;
    if (activeFilter === "in_progress") return s.lessonPlan === null;
    return true;
  });

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.id}
              onClick={() => setActiveFilter(stat.id)}
              className={`border rounded-xl px-5 py-4 flex flex-col justify-between h-28 transition duration-250 select-none cursor-pointer ${
                activeFilter === stat.id
                  ? "bg-gray-900 border-blue-500 shadow-md shadow-blue-500/5 ring-1 ring-blue-500/20"
                  : "bg-gray-900 border-gray-800 hover:border-gray-700"
              }`}
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


        {/* Sessions List Container */}
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
          <div className="flex flex-col flex-1">
            {/* Filter Tabs Row */}
            <div className="flex border-b border-gray-800 mb-6 text-sm gap-2 select-none overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setActiveFilter("all")}
                className={`pb-3 px-3.5 font-semibold border-b-2 transition duration-200 cursor-pointer whitespace-nowrap ${
                  activeFilter === "all"
                    ? "border-blue-500 text-white"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                💬 All Sessions ({totalSessions})
              </button>
              <button
                onClick={() => setActiveFilter("lessons")}
                className={`pb-3 px-3.5 font-semibold border-b-2 transition duration-200 cursor-pointer whitespace-nowrap ${
                  activeFilter === "lessons"
                    ? "border-emerald-500 text-white"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                📝 Lesson Plans ({totalLessons})
              </button>
              <button
                onClick={() => setActiveFilter("courses")}
                className={`pb-3 px-3.5 font-semibold border-b-2 transition duration-200 cursor-pointer whitespace-nowrap ${
                  activeFilter === "courses"
                    ? "border-indigo-500 text-white"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                📘 Course Plans ({totalCourses})
              </button>
              <button
                onClick={() => setActiveFilter("in_progress")}
                className={`pb-3 px-3.5 font-semibold border-b-2 transition duration-200 cursor-pointer whitespace-nowrap ${
                  activeFilter === "in_progress"
                    ? "border-yellow-500 text-white"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                ⏳ In Progress ({totalInProgress})
              </button>
            </div>

            {/* Filtered Content */}
            {filteredSessions.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 sm:p-12 text-center flex-1 flex flex-col items-center justify-center min-h-[220px]">
                <p className="text-3xl mb-3 select-none">🔍</p>
                <p className="text-white font-semibold mb-1">
                  {activeFilter === "plans" && "No plans generated yet"}
                  {activeFilter === "lessons" && "No lesson plans found"}
                  {activeFilter === "courses" && "No course plans found"}
                  {activeFilter === "in_progress" && "No sessions in progress"}
                </p>
                <p className="text-gray-400 text-xs max-w-sm mb-4">
                  {activeFilter === "plans" && "Start planning a lesson or course to generate documents here."}
                  {activeFilter === "lessons" && "Go to 'New Plan' and complete a lesson plan chat session to save it."}
                  {activeFilter === "courses" && "Go to 'New Plan' and complete a course plan chat session to save it."}
                  {activeFilter === "in_progress" && "All your active chats have completed plans generated."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSessions.map((s) => (
                  <div
                    key={s.id}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between hover:border-gray-700 transition gap-4"
                  >
                    {/* Session Info */}
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex items-center gap-2 mb-1.5 min-w-0">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide border shrink-0 uppercase ${
                          s.planType === "course"
                            ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}>
                          {s.planType === "course" ? "📚 Course" : "📝 Lesson"}
                        </span>
                        {renamingId === s.id ? (
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <input
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              className="bg-gray-800 border border-gray-700 text-white text-xs rounded px-2 py-0.5 w-full max-w-[200px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleRenameSubmit(s.id);
                                if (e.key === "Escape") setRenamingId(null);
                              }}
                            />
                            <button
                              onClick={() => handleRenameSubmit(s.id)}
                              className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded cursor-pointer font-semibold shrink-0"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setRenamingId(null)}
                              className="text-gray-400 hover:text-white text-[10px] px-1 py-0.5 cursor-pointer font-semibold shrink-0"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 min-w-0 flex-1 group">
                            <p className="text-white text-sm font-semibold truncate" title={s.title}>{s.title}</p>
                            <button
                              onClick={() => {
                                setRenamingId(s.id);
                                setRenameValue(s.title);
                              }}
                              className="text-gray-500 hover:text-blue-400 text-xs cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity font-semibold"
                              title="Rename"
                            >
                              ✏️
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
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

                      {!s.lessonPlan && (
                        <>
                          {isReadyToGenerate(s) && (
                            <button
                              onClick={() => router.push(`/lesson-plan/${s.id}`)}
                              className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-xs px-3.5 py-2 sm:py-1.5 rounded-lg transition font-semibold flex-1 sm:flex-none text-center cursor-pointer"
                            >
                              ⚡ Generate Plan
                            </button>
                          )}
                          <button
                            onClick={() => router.push(`/chat?session=${s.id}`)}
                            className="bg-yellow-600/10 hover:bg-yellow-600/20 text-yellow-400 text-xs px-3.5 py-2 sm:py-1.5 rounded-lg transition font-semibold flex-1 sm:flex-none text-center cursor-pointer"
                          >
                            💬 Chat
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
                            {deleting === s.id ? "..." : "Confirm"}
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
        )}
      </div>

      <AppFooter />
    </div>
  );
}