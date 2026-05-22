"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/app/components/AdminHeader";

type Stats = {
  totalUsers: number;
  newUsersThisWeek: number;
  totalSessions: number;
  totalPlans: number;
  newSessionsThisWeek: number;
  topSubjects: { subject: string; count: number }[];
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
  _count: { sessions: number; lessonPlans: number };
};

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Stats loading on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        const statsData = await res.json();
        setStats(statsData);
      } catch (err) {
        console.error("Failed to load admin stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Search debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search change
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Users loading on page or search change
  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const res = await fetch(
          `/api/admin/users?page=${page}&limit=10&search=${encodeURIComponent(
            debouncedSearch
          )}`
        );
        const data = await res.json();
        setUsers(data.users || []);
        setTotalPages(data.totalPages || 1);
        setTotalUsers(data.total || 0);
      } catch (err) {
        console.error("Failed to load admin users:", err);
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, [page, debouncedSearch]);

  const handleToggle = async (userId: string, disabled: boolean) => {
    setTogglingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled }),
      });
      if (!res.ok) {
        alert("Failed to update user.");
        return;
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, disabled } : u))
      );
    } catch (err) {
      console.error("Toggle error:", err);
    } finally {
      setTogglingId(null);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const filteredUsers = users;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <AdminHeader />

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Total Users", value: stats.totalUsers },
              { label: "New This Week", value: stats.newUsersThisWeek },
              { label: "Total Sessions", value: stats.totalSessions },
              { label: "Plans Generated", value: stats.totalPlans },
              { label: "Sessions This Week", value: stats.newSessionsThisWeek },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-4"
              >
                <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
                <p className="text-white text-2xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Top subjects */}
        {stats && stats.topSubjects.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-5">
            <h2 className="text-white font-semibold text-sm mb-4">
              Top Subjects
            </h2>
            <div className="flex flex-wrap gap-2">
              {stats.topSubjects.map((s) => (
                <div
                  key={s.subject}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 flex items-center gap-2"
                >
                  <span className="text-white text-sm">{s.subject}</span>
                  <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-white font-semibold text-sm">
              Users ({totalUsers})
            </h2>
            <input
              type="text"
              placeholder="Search by name, email, subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>

          <div className="divide-y divide-gray-800">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-800/50 transition"
              >
                {/* User info */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => router.push(`/admin/users/${u.id}`)}
                >
                  <div className="flex items-center gap-2">
                    <p className="text-white text-sm font-medium">{u.name}</p>
                    {u.role === "admin" && (
                      <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                        Admin
                      </span>
                    )}
                    {u.disabled && (
                      <span className="bg-red-600/20 text-red-400 text-xs px-2 py-0.5 rounded-full border border-red-600/30">
                        Disabled
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">{u.email}</p>
                  <div className="flex gap-3 mt-1">
                    <span className="text-gray-600 text-xs">{u.subject}</span>
                    <span className="text-gray-700 text-xs">·</span>
                    <span className="text-gray-600 text-xs">
                      {u._count.sessions} sessions
                    </span>
                    <span className="text-gray-700 text-xs">·</span>
                    <span className="text-gray-600 text-xs">
                      {u._count.lessonPlans} plans
                    </span>
                    <span className="text-gray-700 text-xs">·</span>
                    <span className="text-gray-600 text-xs">
                      Joined {formatDate(u.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Toggle */}
                {u.role !== "admin" && (
                  <button
                    onClick={() => handleToggle(u.id, !u.disabled)}
                    disabled={togglingId === u.id}
                    className={`ml-4 text-xs px-3 py-1.5 rounded-lg transition shrink-0 ${
                      u.disabled
                        ? "bg-green-600 hover:bg-green-500 text-white"
                        : "bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/30"
                    }`}
                  >
                    {togglingId === u.id
                      ? "..."
                      : u.disabled
                      ? "Enable"
                      : "Disable"}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Pagination controls */}
          <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between text-sm text-gray-400 bg-gray-900/50">
            <div>
              {usersLoading ? (
                <span>Loading users...</span>
              ) : (
                <span>
                  Showing <span className="text-white font-medium">{filteredUsers.length}</span> of{" "}
                  <span className="text-white font-medium">{totalUsers}</span> users
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1 || usersLoading}
                className="px-3 py-1.5 rounded bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <span>
                Page <span className="text-white font-medium">{page}</span> of{" "}
                <span className="text-white font-medium">{totalPages}</span>
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages || usersLoading}
                className="px-3 py-1.5 rounded bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}