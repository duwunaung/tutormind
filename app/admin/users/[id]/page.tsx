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
  subscriptionExpiresAt: string | null;
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
  const [updatingSubscription, setUpdatingSubscription] = useState(false);
  const [customDate, setCustomDate] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/admin/users/${id}`);
        const data = await res.json();
        setUser(data.user);
        if (data.user?.subscriptionExpiresAt) {
          setCustomDate(new Date(data.user.subscriptionExpiresAt).toISOString().split("T")[0]);
        }
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

  const updateSubscription = async (newDate: Date | null) => {
    if (!user) return;
    setUpdatingSubscription(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionExpiresAt: newDate ? newDate.toISOString() : null,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || "Failed to update subscription.");
        return;
      }
      const data = await res.json();
      setUser((prev) => prev ? { ...prev, subscriptionExpiresAt: data.user.subscriptionExpiresAt } : prev);
      
      if (data.user.subscriptionExpiresAt) {
        setCustomDate(new Date(data.user.subscriptionExpiresAt).toISOString().split("T")[0]);
      } else {
        setCustomDate("");
      }
    } catch (err) {
      console.error("Subscription update error:", err);
    } finally {
      setUpdatingSubscription(false);
    }
  };

  const handleExtend = (increment: "1m" | "3m" | "1y") => {
    if (!user) return;
    const baseDate = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date()
      ? new Date(user.subscriptionExpiresAt)
      : new Date();

    const newDate = new Date(baseDate);
    if (increment === "1m") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (increment === "3m") {
      newDate.setMonth(newDate.getMonth() + 3);
    } else if (increment === "1y") {
      newDate.setFullYear(newDate.getFullYear() + 1);
    }
    updateSubscription(newDate);
  };

  const handleCustomDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDate) return;
    const targetDate = new Date(customDate);
    targetDate.setHours(23, 59, 59, 999);
    updateSubscription(targetDate);
  };

  const handleRevoke = () => {
    if (confirm("Are you sure you want to revoke subscription access?")) {
      updateSubscription(null);
    }
  };

  const handleRoleChange = async (newRole: "user" | "admin") => {
    if (!user) return;
    if (confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      try {
        const res = await fetch(`/api/admin/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          alert(errorData.error || "Failed to update role.");
          return;
        }
        const data = await res.json();
        setUser((prev) => prev ? { ...prev, role: data.user.role } : prev);
      } catch (err) {
        console.error("Role update error:", err);
      }
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
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="text-white text-lg font-bold">{user.name}</h2>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(e.target.value as "user" | "admin")}
                  className="bg-gray-800 border border-gray-700 text-white text-xs px-2 py-0.5 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin Staff</option>
                </select>
                {user.disabled ? (
                  <span className="bg-red-600/20 text-red-400 text-xs px-2 py-0.5 rounded-full border border-red-600/30">
                    Suspended
                  </span>
                ) : (
                  <span className="bg-green-600/20 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-600/30">
                    Active Profile
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
                className={`text-xs font-semibold px-4 py-2 rounded-xl transition ${
                  user.disabled
                    ? "bg-green-600 hover:bg-green-500 text-white"
                    : "bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/30"
                }`}
              >
                {toggling ? "..." : user.disabled ? "Activate Profile" : "Suspend Profile"}
              </button>
            )}
          </div>
        </div>

        {/* Subscription Panel */}
        {user.role !== "admin" && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-5">
            <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              ⏳ Subscription Management
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Current Status and Quick Actions */}
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Current Subscription Status</div>
                  <div className="flex items-center gap-2">
                    {user.subscriptionExpiresAt ? (
                      new Date() > new Date(user.subscriptionExpiresAt) ? (
                        <span className="bg-red-500/10 text-red-400 text-xs px-2.5 py-1 rounded-full border border-red-500/20 font-medium">
                          Expired on {formatDate(user.subscriptionExpiresAt)}
                        </span>
                      ) : (
                        <span className="bg-green-500/10 text-green-400 text-xs px-2.5 py-1 rounded-full border border-green-500/20 font-medium">
                          Active until {formatDate(user.subscriptionExpiresAt)}
                        </span>
                      )
                    ) : (
                      <span className="bg-gray-800 text-gray-400 text-xs px-2.5 py-1 rounded-full border border-gray-700 font-medium">
                        No Active Subscription
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-2">Extend Subscription (Quick Add)</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleExtend("1m")}
                      disabled={updatingSubscription}
                      className="bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition disabled:opacity-50"
                    >
                      +1 Month
                    </button>
                    <button
                      onClick={() => handleExtend("3m")}
                      disabled={updatingSubscription}
                      className="bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition disabled:opacity-50"
                    >
                      +3 Months
                    </button>
                    <button
                      onClick={() => handleExtend("1y")}
                      disabled={updatingSubscription}
                      className="bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition disabled:opacity-50"
                    >
                      +1 Year
                    </button>
                    {user.subscriptionExpiresAt && (
                      <button
                        onClick={handleRevoke}
                        disabled={updatingSubscription}
                        className="bg-red-950/30 hover:bg-red-900/40 text-red-400 text-xs font-semibold px-3 py-2 rounded-lg border border-red-900/30 transition disabled:opacity-50"
                      >
                        Revoke Access
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Custom Date Picker */}
              <form onSubmit={handleCustomDateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Set Custom Expiration Date</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      required
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      disabled={updatingSubscription}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1"
                    />
                    <button
                      type="submit"
                      disabled={updatingSubscription || !customDate}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
                    >
                      {updatingSubscription ? "Updating..." : "Save Date"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

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