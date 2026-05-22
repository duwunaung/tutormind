"use client";

import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar (visible only on lg and larger) */}
      <aside className="hidden lg:block w-64 h-screen fixed left-0 top-0 z-20">
        <div className="h-full bg-gray-950 border-r border-gray-800 flex flex-col justify-between p-6">
          <div className="flex flex-col gap-8">
            <div
              className="cursor-pointer"
              onClick={() => router.push("/admin")}
            >
              <h1 className="text-white font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                TutorMind
              </h1>
            </div>

            <nav className="flex flex-col gap-1.5">
              <button
                onClick={() => router.push("/admin")}
                className={`flex items-center gap-3 text-sm px-4 py-2.5 rounded-xl transition font-medium ${
                  pathname === "/admin"
                    ? "text-white bg-gray-900 border border-gray-800"
                    : "text-gray-400 hover:text-white hover:bg-gray-900/50"
                }`}
              >
                <span className="text-base">📊</span>
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => router.push("/admin/users")}
                className={`flex items-center gap-3 text-sm px-4 py-2.5 rounded-xl transition font-medium ${
                  pathname?.startsWith("/admin/users")
                    ? "text-white bg-gray-900 border border-gray-800"
                    : "text-gray-400 hover:text-white hover:bg-gray-900/50"
                }`}
              >
                <span className="text-base">👤</span>
                <span>Users</span>
              </button>
              <button
                onClick={() => router.push("/admin/prompts")}
                className={`flex items-center gap-3 text-sm px-4 py-2.5 rounded-xl transition font-medium ${
                  pathname?.startsWith("/admin/prompts")
                    ? "text-white bg-gray-900 border border-gray-800"
                    : "text-gray-400 hover:text-white hover:bg-gray-900/50"
                }`}
              >
                <span className="text-base">🧙</span>
                <span>Prompts</span>
              </button>
              <button
                onClick={() => router.push("/admin/logs")}
                className={`flex items-center gap-3 text-sm px-4 py-2.5 rounded-xl transition font-medium ${
                  pathname?.startsWith("/admin/logs")
                    ? "text-white bg-gray-900 border border-gray-800"
                    : "text-gray-400 hover:text-white hover:bg-gray-900/50"
                }`}
              >
                <span className="text-base">📋</span>
                <span>Audit Logs</span>
              </button>
            </nav>
          </div>

          <div className="border-t border-gray-800 pt-4">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-3 text-gray-400 hover:text-white text-sm px-4 py-2.5 rounded-xl hover:bg-red-950/30 hover:text-red-400 transition font-medium border border-transparent hover:border-red-900/30"
            >
              <span className="text-base">🚪</span>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header (visible only below lg) */}
      <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-gray-950 border-b border-gray-800 sticky top-0 z-20 w-full">
        <div className="cursor-pointer" onClick={() => router.push("/admin")}>
          <h1 className="text-white font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            TutorMind
          </h1>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-400 hover:text-white p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          aria-label="Toggle menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </header>

      {/* Mobile Sidebar Drawer Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer Menu */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-64 bg-gray-950 border-r border-gray-800 z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col justify-between p-6">
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div
                className="cursor-pointer"
                onClick={() => {
                  router.push("/admin");
                  setIsOpen(false);
                }}
              >
                <h1 className="text-white font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                  TutorMind
                </h1>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col gap-1.5">
              <button
                onClick={() => {
                  router.push("/admin");
                  setIsOpen(false);
                }}
                className={`flex items-center gap-3 text-sm px-4 py-2.5 rounded-xl transition font-medium ${
                  pathname === "/admin"
                    ? "text-white bg-gray-900 border border-gray-800"
                    : "text-gray-400 hover:text-white hover:bg-gray-900/50"
                }`}
              >
                <span className="text-base">📊</span>
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => {
                  router.push("/admin/users");
                  setIsOpen(false);
                }}
                className={`flex items-center gap-3 text-sm px-4 py-2.5 rounded-xl transition font-medium ${
                  pathname?.startsWith("/admin/users")
                    ? "text-white bg-gray-900 border border-gray-800"
                    : "text-gray-400 hover:text-white hover:bg-gray-900/50"
                }`}
              >
                <span className="text-base">👤</span>
                <span>Users</span>
              </button>
              <button
                onClick={() => {
                  router.push("/admin/prompts");
                  setIsOpen(false);
                }}
                className={`flex items-center gap-3 text-sm px-4 py-2.5 rounded-xl transition font-medium ${
                  pathname?.startsWith("/admin/prompts")
                    ? "text-white bg-gray-900 border border-gray-800"
                    : "text-gray-400 hover:text-white hover:bg-gray-900/50"
                }`}
              >
                <span className="text-base">🧙</span>
                <span>Prompts</span>
              </button>
              <button
                onClick={() => {
                  router.push("/admin/logs");
                  setIsOpen(false);
                }}
                className={`flex items-center gap-3 text-sm px-4 py-2.5 rounded-xl transition font-medium ${
                  pathname?.startsWith("/admin/logs")
                    ? "text-white bg-gray-900 border border-gray-800"
                    : "text-gray-400 hover:text-white hover:bg-gray-900/50"
                }`}
              >
                <span className="text-base">📋</span>
                <span>Audit Logs</span>
              </button>
            </nav>
          </div>

          <div className="border-t border-gray-800 pt-4">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-3 text-gray-400 hover:text-white text-sm px-4 py-2.5 rounded-xl hover:bg-red-950/30 hover:text-red-400 transition font-medium border border-transparent hover:border-red-900/30"
            >
              <span className="text-base">🚪</span>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}