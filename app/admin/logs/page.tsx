"use client";

import { useEffect, useState, Suspense } from "react";
import AdminHeader from "@/app/components/AdminHeader";

type AuditLog = {
  id: string;
  action: string;
  actorId: string;
  actorEmail: string;
  actorName: string;
  targetId: string | null;
  targetName: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
};

const ACTION_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "USER_LOGIN", label: "User Logins" },
  { value: "USER_CREATE", label: "User Creation" },
  { value: "USER_SUSPEND", label: "User Suspension" },
  { value: "USER_ACTIVATE", label: "User Activation" },
  { value: "ROLE_CHANGE", label: "Role Changes" },
  { value: "SUBSCRIPTION_EXTEND", label: "Subscription Extension" },
  { value: "SUBSCRIPTION_REVOKE", label: "Subscription Revocation" },
  { value: "PROMPT_CREATE", label: "Prompt Template Creation" },
  { value: "PROMPT_UPDATE", label: "Prompt Template Updates" },
  { value: "EXPORT_PLAN", label: "Lesson Plan Exports" },
];

function AuditLogsContent() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Search debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);



  // Load audit logs data
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          page: page.toString(),
          limit: "15",
          search: debouncedSearch,
          action: actionFilter,
        });
        const res = await fetch(`/api/admin/logs?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
          setTotalPages(data.totalPages || 1);
          setTotalLogs(data.total || 0);
        }
      } catch (err) {
        console.error("Failed to load audit logs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [page, debouncedSearch, actionFilter]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "USER_LOGIN":
        return (
          <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium whitespace-nowrap">
            🔑 Login
          </span>
        );
      case "USER_CREATE":
        return (
          <span className="bg-blue-500/10 text-blue-400 text-xs px-2.5 py-1 rounded-full border border-blue-500/20 font-medium whitespace-nowrap">
            👤 User Created
          </span>
        );
      case "USER_SUSPEND":
        return (
          <span className="bg-red-500/10 text-red-400 text-xs px-2.5 py-1 rounded-full border border-red-500/20 font-medium whitespace-nowrap">
            🚫 Suspended
          </span>
        );
      case "USER_ACTIVATE":
        return (
          <span className="bg-teal-500/10 text-teal-400 text-xs px-2.5 py-1 rounded-full border border-teal-500/20 font-medium whitespace-nowrap">
            ✅ Activated
          </span>
        );
      case "ROLE_CHANGE":
        return (
          <span className="bg-purple-500/10 text-purple-400 text-xs px-2.5 py-1 rounded-full border border-purple-500/20 font-medium whitespace-nowrap">
            🛡️ Role Change
          </span>
        );
      case "SUBSCRIPTION_EXTEND":
        return (
          <span className="bg-pink-500/10 text-pink-400 text-xs px-2.5 py-1 rounded-full border border-pink-500/20 font-medium whitespace-nowrap">
            💎 Sub Extended
          </span>
        );
      case "SUBSCRIPTION_REVOKE":
        return (
          <span className="bg-orange-500/10 text-orange-400 text-xs px-2.5 py-1 rounded-full border border-orange-500/20 font-medium whitespace-nowrap">
            ⚠️ Sub Revoked
          </span>
        );
      case "PROMPT_CREATE":
        return (
          <span className="bg-violet-500/10 text-violet-400 text-xs px-2.5 py-1 rounded-full border border-violet-500/20 font-medium whitespace-nowrap">
            🧙 Prompt Created
          </span>
        );
      case "PROMPT_UPDATE":
        return (
          <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2.5 py-1 rounded-full border border-indigo-500/20 font-medium whitespace-nowrap">
            📝 Prompt Updated
          </span>
        );
      case "EXPORT_PLAN":
        return (
          <span className="bg-amber-500/10 text-amber-400 text-xs px-2.5 py-1 rounded-full border border-amber-500/20 font-medium whitespace-nowrap">
            📂 Plan Exported
          </span>
        );
      default:
        return (
          <span className="bg-gray-800 text-gray-300 text-xs px-2.5 py-1 rounded-full border border-gray-700 font-medium whitespace-nowrap">
            ⚙️ {action}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col lg:flex-row">
      <AdminHeader />

      <main className="flex-1 lg:pl-64 w-full">
        <div className="max-w-6xl w-full mx-auto px-6 py-8 flex flex-col gap-6">
          {/* Top header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">System Audit Logs</h1>
              <p className="text-gray-500 text-xs mt-1">
                Monitor system operations, security triggers, and compliance modifications in real-time.
              </p>
            </div>
          </div>

          {/* Directory Box */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
            {/* Header, Search & Filtering Panel */}
            <div className="px-6 py-4 border-b border-gray-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-white font-semibold text-sm">Action Stream</h2>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Filtered logs: <span className="text-gray-300 font-semibold">{totalLogs}</span> entries
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Action dropdown */}
                <select
                  value={actionFilter}
                  onChange={(e) => {
                    setActionFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ACTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* Text search */}
                <input
                  type="text"
                  placeholder="Search email, name, or targets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                />
              </div>
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-gray-950/40 text-gray-400 text-[10px] uppercase tracking-wider font-semibold text-left">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">Timestamp</th>
                    <th scope="col" className="px-6 py-3.5">Action</th>
                    <th scope="col" className="px-6 py-3.5">Actor</th>
                    <th scope="col" className="px-6 py-3.5">Target</th>
                    <th scope="col" className="px-6 py-3.5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/80 text-xs">
                  {loading && logs.length === 0 ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4.5"><div className="h-4 bg-gray-800 rounded w-28" /></td>
                        <td className="px-6 py-4.5"><div className="h-5 bg-gray-800 rounded-full w-24" /></td>
                        <td className="px-6 py-4.5"><div className="h-4 bg-gray-800 rounded w-32" /></td>
                        <td className="px-6 py-4.5"><div className="h-4 bg-gray-800 rounded w-40" /></td>
                        <td className="px-6 py-4.5 text-right"><div className="h-4 bg-gray-800 rounded ml-auto w-12" /></td>
                      </tr>
                    ))
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No audit logs found matching the filters.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-800/20 transition-colors">
                        <td className="px-6 py-4.5 text-gray-400 font-mono whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-6 py-4.5 whitespace-nowrap">
                          {getActionBadge(log.action)}
                        </td>
                        <td className="px-6 py-4.5 whitespace-nowrap">
                          <div className="font-semibold text-white">{log.actorName}</div>
                          <div className="text-gray-500 text-[10px]">{log.actorEmail}</div>
                        </td>
                        <td className="px-6 py-4.5">
                          {log.targetName ? (
                            <>
                              <div className="text-gray-300 font-medium truncate max-w-[200px]" title={log.targetName}>
                                {log.targetName}
                              </div>
                              <div className="text-gray-500 text-[9px] font-mono truncate max-w-[150px]" title={log.targetId || ""}>
                                ID: {log.targetId || "N/A"}
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-medium text-[10px] px-2.5 py-1.5 rounded-lg border border-gray-700 transition"
                          >
                            🔍 Inspect
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Panel */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg text-xs transition font-semibold"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-500 font-medium">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg text-xs transition font-semibold"
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Slide-over Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          {/* Overlay background */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedLog(null)}
          />

          {/* Drawer container */}
          <div className="relative w-full max-w-lg h-full bg-gray-950 border-l border-gray-800 p-6 flex flex-col gap-6 shadow-2xl animate-in slide-in-from-right duration-250">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Log Inspection</h3>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">ID: {selectedLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-900 border border-transparent hover:border-gray-800 transition"
              >
                ✕ Close
              </button>
            </div>

            {/* Core details list */}
            <div className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-3 gap-2 bg-gray-900/60 p-3 rounded-lg border border-gray-800/80">
                <span className="text-gray-500 font-medium">Timestamp:</span>
                <span className="col-span-2 font-mono text-gray-300">{formatDate(selectedLog.createdAt)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 bg-gray-900/60 p-3 rounded-lg border border-gray-800/80">
                <span className="text-gray-500 font-medium">Action:</span>
                <span className="col-span-2">{getActionBadge(selectedLog.action)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 bg-gray-900/60 p-3 rounded-lg border border-gray-800/80">
                <span className="text-gray-500 font-medium">Actor:</span>
                <div className="col-span-2">
                  <div className="text-white font-semibold">{selectedLog.actorName}</div>
                  <div className="text-gray-500 text-[10px] font-mono">{selectedLog.actorEmail}</div>
                  <div className="text-gray-600 text-[9px] font-mono mt-0.5">ID: {selectedLog.actorId}</div>
                </div>
              </div>
              {selectedLog.targetName && (
                <div className="grid grid-cols-3 gap-2 bg-gray-900/60 p-3 rounded-lg border border-gray-800/80">
                  <span className="text-gray-500 font-medium">Target Entity:</span>
                  <div className="col-span-2">
                    <div className="text-gray-200 font-medium">{selectedLog.targetName}</div>
                    <div className="text-gray-500 text-[10px] font-mono mt-0.5">ID: {selectedLog.targetId || "N/A"}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Extra payload details JSON drawer */}
            <div className="flex-1 flex flex-col min-h-0 gap-2">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Payload Details (Metadata)</span>
              <div className="flex-1 bg-gray-900/80 border border-gray-800 rounded-xl p-4 font-mono text-xs overflow-auto text-emerald-400 select-all">
                {selectedLog.details ? (
                  <pre className="whitespace-pre-wrap">{JSON.stringify(selectedLog.details, null, 2)}</pre>
                ) : (
                  <span className="text-gray-600 italic">No extra metadata payload.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuditLogsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuditLogsContent />
    </Suspense>
  );
}
