"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminHeader from "@/app/components/AdminHeader";

type Session = {
  id: string;
  title: string;
  subject: string;
  planType: string;
  createdAt: string;
  lessonPlan: { id: string } | null;
};

type User = {
  id: string;
  name: string;
  email: string;
  subject: string;
  gradeLevel: string;
  role: string;
  disabled: boolean;
  createdAt: string;
  sessions: Session[];
  _count: { sessions: number; lessonPlans: number };
};

export default function AdminUserPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/admin/users/${id}`);
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error("Failed to load user:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleToggle = async () => {
    if (!user) return;
    setToggling(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled: !user.disabled }),
      });
      if (!res.ok) { alert("Failed to update user."); return; }
      setUser((prev) => prev ? { ...prev, disabled: !prev.disabled } : prev);
    } catch (err) {
      console.error("Toggle error:", err);
    } finally {
      setToggling(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col lg:flex-row text-white">
        <AdminHeader />
        <main className="flex-1 lg:pl-64 w-full flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col lg:flex-row text-white">
        <AdminHeader />
        <main className="flex-1 lg:pl-64 w-full flex items-center justify-center">
          <p className="text-gray-400">User not found.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col lg:flex-row text-white">
      <AdminHeader />

      <main className="flex-1 lg:pl-64 w-full">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Back */}
        <button
          onClick={() => router.push("/admin/users")}
          className="text-gray-400 hover:text-white text-sm transition"
        >
          ← Back to Users
        </button>

        {/* User card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-white text-lg font-bold">{user.name}</h2>
                {user.role === "admin" && (
                  <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                    Admin
                  </span>
                )}
                {user.disabled ? (
                  <span className="bg-red-600/20 text-red-400 text-xs px-2 py-0.5 rounded-full border border-red-600/30">
                    Disabled
                  </span>
                ) : (
                  <span className="bg-green-600/20 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-600/30">
                    Active
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm">{user.email}</p>
              <div className="flex gap-4 mt-3 text-gray-500 text-xs">
                <span>📚 {user.subject}</span>
                <span>🎓 {user.gradeLevel}</span>
                <span>📅 Joined {formatDate(user.createdAt)}</span>
              </div>
              <div className="flex gap-4 mt-2 text-gray-500 text-xs">
                <span>{user._count.sessions} sessions</span>
                <span>·</span>
                <span>{user._count.lessonPlans} plans generated</span>
              </div>
            </div>

            {/* Toggle button */}
            {user.role !== "admin" && (
              <button
                onClick={handleToggle}
                disabled={toggling}
                className={`text-sm px-4 py-2 rounded-lg transition ${
                  user.disabled
                    ? "bg-green-600 hover:bg-green-500 text-white"
                    : "bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/30"
                }`}
              >
                {toggling ? "..." : user.disabled ? "Enable Account" : "Disable Account"}
              </button>
            )}
          </div>
        </div>

        {/* Sessions list */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h3 className="text-white font-semibold text-sm">
              Sessions ({user.sessions.length})
            </h3>
          </div>

          {user.sessions.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500 text-sm">No sessions yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {user.sessions.map((s) => (
                <div key={s.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm">{s.title}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-gray-500 text-xs">{s.subject}</span>
                      <span className="text-gray-700 text-xs">·</span>
                      <span className="text-gray-500 text-xs capitalize">
                        {s.planType}
                      </span>
                      <span className="text-gray-700 text-xs">·</span>
                      <span className="text-gray-500 text-xs">
                        {formatDate(s.createdAt)}
                      </span>
                    </div>
                  </div>
                  {s.lessonPlan ? (
                    <span className="text-green-500 text-xs">✓ Plan ready</span>
                  ) : (
                    <span className="text-gray-600 text-xs">No plan</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  </div>
);
}