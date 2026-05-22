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
  subscriptionExpiresAt: string | null;
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

  // Create user states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subjectsList, setSubjectsList] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" as "user" | "admin",
    subject: "",
    gradeLevel: "",
    duration: "trial",
  });

  const GRADE_LEVELS = [
    "Elementary (K-5)",
    "Middle School (6-8)",
    "High School (9-12)",
    "College / Adult",
  ];

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await fetch("/api/subjects");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.subjects) && data.subjects.length > 0) {
            setSubjectsList(data.subjects);
          } else {
            setSubjectsList(["Math", "Science", "English / Language Arts", "History", "Software Engineering"]);
          }
        } else {
          setSubjectsList(["Math", "Science", "English / Language Arts", "History", "Software Engineering"]);
        }
      } catch {
        setSubjectsList(["Math", "Science", "English / Language Arts", "History", "Software Engineering"]);
      }
    };
    fetchSubjects();
  }, []);

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

  const getSubscriptionBadge = (user: User) => {
    if (user.role === "admin") {
      return (
        <span className="bg-purple-600/20 text-purple-400 text-xs px-2 py-0.5 rounded-full border border-purple-600/30">
          Admin / Lifetime
        </span>
      );
    }
    if (!user.subscriptionExpiresAt) {
      return (
        <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full border border-gray-700">
          No Subscription
        </span>
      );
    }
    const isExpired = new Date() > new Date(user.subscriptionExpiresAt);
    if (isExpired) {
      return (
        <span className="bg-red-500/10 text-red-400 text-xs px-2 py-0.5 rounded-full border border-red-500/20">
          Expired ({formatDate(user.subscriptionExpiresAt)})
        </span>
      );
    }
    return (
      <span className="bg-green-500/10 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-500/20">
        Active (Until {formatDate(user.subscriptionExpiresAt)})
      </span>
    );
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError("");
    setCreateSuccess("");

    let subscriptionExpiresAt: Date | null = null;
    if (createForm.role === "user") {
      const now = Date.now();
      if (createForm.duration === "trial") {
        subscriptionExpiresAt = new Date(now + 7 * 24 * 60 * 60 * 1000);
      } else if (createForm.duration === "1m") {
        subscriptionExpiresAt = new Date(now + 30 * 24 * 60 * 60 * 1000);
      } else if (createForm.duration === "3m") {
        subscriptionExpiresAt = new Date(now + 90 * 24 * 60 * 60 * 1000);
      } else if (createForm.duration === "1y") {
        subscriptionExpiresAt = new Date(now + 365 * 24 * 60 * 60 * 1000);
      }
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          email: createForm.email,
          password: createForm.password,
          role: createForm.role,
          subject: createForm.subject,
          gradeLevel: createForm.gradeLevel,
          subscriptionExpiresAt: subscriptionExpiresAt ? subscriptionExpiresAt.toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "Failed to create account");
        return;
      }

      setCreateSuccess("Account created successfully!");
      
      // Reset form
      setCreateForm({
        name: "",
        email: "",
        password: "",
        role: "user",
        subject: "",
        gradeLevel: "",
        duration: "trial",
      });
      setShowPassword(false);

      // Refresh list
      const fetchRes = await fetch(
        `/api/admin/users?page=${page}&limit=10&search=${encodeURIComponent(
          debouncedSearch
        )}`
      );
      const fetchVal = await fetchRes.json();
      setUsers(fetchVal.users || []);
      setTotalPages(fetchVal.totalPages || 1);
      setTotalUsers(fetchVal.total || 0);

      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess("");
      }, 1500);

    } catch {
      setCreateError("Failed to submit request.");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col lg:flex-row">
      <AdminHeader />

      <main className="flex-1 lg:pl-64 w-full">
        <div className="max-w-6xl w-full mx-auto px-6 py-8 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">User Directory</h1>
              <p className="text-gray-500 text-xs mt-1">
                Manage registered accounts, view session logs, and disable/enable profiles.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center gap-1.5 self-start sm:self-center"
            >
              <span>➕ Create Account</span>
            </button>
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
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-white text-sm font-medium">{u.name}</p>
                        {getSubscriptionBadge(u)}
                        {u.disabled && (
                          <span className="bg-red-600/20 text-red-400 text-xs px-2 py-0.5 rounded-full border border-red-600/30">
                            Suspended
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

        {/* Create Modal Dialog */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCreateModal(false)}
            />
            
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]">
              <h2 className="text-xl font-bold text-white mb-1">Create Account</h2>
              <p className="text-gray-400 text-xs mb-6">Manually register a user or administrative staff.</p>

              {createError && (
                <div className="bg-red-500/10 text-red-400 text-xs rounded-lg p-3 mb-4 border border-red-500/20">
                  {createError}
                </div>
              )}

              {createSuccess && (
                <div className="bg-green-500/10 text-green-400 text-xs rounded-lg p-3 mb-4 border border-green-500/20">
                  {createSuccess}
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Jane Smith"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="jane@email.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-3 pr-10 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Min 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 text-xs px-1"
                    >
                      {showPassword ? "👁️" : "🙈"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">System Role</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as "user" | "admin" })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="user">Regular User (App Subscriber)</option>
                    <option value="admin">Administrator Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Subject Specialization</label>
                  <select
                    required
                    value={createForm.subject}
                    onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select subject</option>
                    {subjectsList.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Grade Level</label>
                  <select
                    required
                    value={createForm.gradeLevel}
                    onChange={(e) => setCreateForm({ ...createForm, gradeLevel: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select grade level</option>
                    {GRADE_LEVELS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {createForm.role === "user" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Initial Subscription Duration</label>
                    <select
                      value={createForm.duration}
                      onChange={(e) => setCreateForm({ ...createForm, duration: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="trial">7-Day Free Trial</option>
                      <option value="none">None (Expired / Needs Payment)</option>
                      <option value="1m">1 Month</option>
                      <option value="3m">3 Months</option>
                      <option value="1y">1 Year</option>
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-800/80">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                  >
                    {createLoading ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
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
