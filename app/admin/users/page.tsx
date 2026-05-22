"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/app/components/AdminHeader";

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

function AdminUsersContent() {
  const router = useRouter();

  // Users states
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Search debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search change
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load users data whenever page or search changes
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

  // User active/disabled toggle handler
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

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col lg:flex-row">
      <AdminHeader />

      <main className="flex-1 lg:pl-64 w-full">
        <div className="max-w-6xl w-full mx-auto px-6 py-8 flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold">User Directory</h1>
            <p className="text-gray-500 text-xs mt-1">
              Manage registered accounts, view session logs, and disable/enable profiles.
            </p>
          </div>

          <section className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
            {/* Search Input Bar */}
            <div className="px-6 py-4 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-white font-semibold text-sm">
                  Active Users
                </h2>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Filter by name, email, subject, or grade level.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                  Total: {totalUsers}
                </span>
                <input
                  type="text"
                  placeholder="Search by name, email, subject..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                />
              </div>
            </div>

            {/* Users list directory */}
            <div className="divide-y divide-gray-800">
              {usersLoading && users.length === 0 ? (
                // Skeleton loading rows for table list
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-6 py-5 animate-pulse flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="w-1/4 h-4 bg-gray-800 rounded" />
                      <div className="w-1/3 h-3 bg-gray-800 rounded" />
                      <div className="w-1/2 h-3 bg-gray-800 rounded mt-1" />
                    </div>
                    <div className="w-16 h-8 bg-gray-800 rounded" />
                  </div>
                ))
              ) : users.length === 0 ? (
                <div className="text-gray-500 text-xs py-8 text-center bg-gray-900/50">
                  No users match the search queries.
                </div>
              ) : (
                users.map((u) => (
                  <div
                    key={u.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-800/50 transition"
                  >
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
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                        <span className="text-gray-600 text-xs">📚 {u.subject}</span>
                        <span className="text-gray-700 text-xs">·</span>
                        <span className="text-gray-600 text-xs">🎓 {u.gradeLevel}</span>
                        <span className="text-gray-700 text-xs">·</span>
                        <span className="text-gray-600 text-xs">
                          💬 {u._count.sessions} sessions
                        </span>
                        <span className="text-gray-700 text-xs">·</span>
                        <span className="text-gray-600 text-xs">
                          📄 {u._count.lessonPlans} plans
                        </span>
                        <span className="text-gray-700 text-xs">·</span>
                        <span className="text-gray-600 text-xs">
                          Joined {formatDate(u.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Suspend/Enable Toggle */}
                    {u.role !== "admin" && (
                      <button
                        onClick={() => handleToggle(u.id, !u.disabled)}
                        disabled={togglingId === u.id}
                        className={`ml-4 text-xs px-3 py-1.5 rounded-lg transition shrink-0 font-medium ${
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
                ))
              )}
            </div>

            {/* Pagination footer */}
            <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between text-sm text-gray-400 bg-gray-900/50">
              <div>
                {usersLoading ? (
                  <span>Loading users...</span>
                ) : (
                  <span>
                    Showing <span className="text-white font-medium">{users.length}</span> of{" "}
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
          </section>
        </div>
      </main>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AdminUsersContent />
    </Suspense>
  );
}
