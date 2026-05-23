"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

type Mode = "wizard" | "chat" | null;

interface AppHeaderProps {
  mode?: Mode;
  actions?: React.ReactNode;
}

export default function AppHeader({ mode, actions }: AppHeaderProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const user = session?.user as { subject?: string; gradeLevel?: string } | undefined;
  const subject = user?.subject || "";
  const gradeLevel = user?.gradeLevel || "";

  return (
    <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 sticky top-0 z-20 relative">
      <div className="max-w-3xl mx-auto flex items-center justify-between">

        {/* Left — Logo + subtitle */}
        <div
          className="cursor-pointer select-none"
          onClick={() => {
            router.push("/dashboard");
            setMobileMenuOpen(false);
          }}
        >
          <h1 className="text-white font-bold text-base tracking-tight">TutorMind</h1>
          {subject && (
            <p className="text-gray-400 text-[10px] sm:text-xs mt-0.5 hidden sm:block">
              {subject}{gradeLevel ? ` · ${gradeLevel}` : ""}
            </p>
          )}
        </div>

        {/* Right Desktop Nav (hidden on mobile) */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Wizard / Chat toggle */}
          {mode && (
            <div className="flex bg-gray-800 rounded-lg p-1 text-xs">
              <button
                onClick={() => router.push("/new-plan")}
                className={`px-3 py-1.5 rounded-md font-medium transition ${mode === "wizard"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white"
                  }`}
              >
                🧙 Wizard
              </button>
              <button
                onClick={() => router.push("/chat")}
                className={`px-3 py-1.5 rounded-md font-medium transition ${mode === "chat"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white"
                  }`}
              >
                💬 Chat
              </button>
            </div>
          )}

          {/* Page-specific action buttons */}
          {actions}

          {/* Dashboard link */}
          <button
            onClick={() => router.push("/dashboard")}
            className="text-gray-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-gray-800 transition font-medium"
          >
            Dashboard
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-gray-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-gray-800 transition font-medium"
          >
            Sign out
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex sm:hidden items-center justify-center p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition focus:outline-none"
        >
          {mobileMenuOpen ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-gray-900 border-b border-gray-800 px-6 py-5 flex flex-col gap-5 shadow-2xl z-30 animate-in fade-in slide-in-from-top-2 duration-150">
          {subject && (
            <div className="pb-3 border-b border-gray-800/80">
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block mb-0.5">Specialty</span>
              <span className="text-sm text-gray-200 font-semibold">
                {subject}{gradeLevel ? ` · ${gradeLevel}` : ""}
              </span>
            </div>
          )}

          {/* Wizard / Chat toggle on mobile */}
          {mode && (
            <div className="flex bg-gray-805 bg-gray-850 bg-gray-800 rounded-xl p-1 text-xs w-full">
              <button
                onClick={() => {
                  router.push("/new-plan");
                  setMobileMenuOpen(false);
                }}
                className={`flex-1 py-2.5 rounded-lg font-semibold text-center transition ${
                  mode === "wizard" ? "bg-blue-600 text-white" : "text-gray-400"
                }`}
              >
                🧙 Wizard
              </button>
              <button
                onClick={() => {
                  router.push("/chat");
                  setMobileMenuOpen(false);
                }}
                className={`flex-1 py-2.5 rounded-lg font-semibold text-center transition ${
                  mode === "chat" ? "bg-blue-600 text-white" : "text-gray-400"
                }`}
              >
                💬 Chat
              </button>
            </div>
          )}

          {/* Page Actions on mobile */}
          {actions && (
            <div className="flex flex-col gap-2.5 pb-2 border-b border-gray-800/80">
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Actions</span>
              <div className="flex flex-col gap-2.5" onClick={() => setMobileMenuOpen(false)}>
                {actions}
              </div>
            </div>
          )}

          {/* Navigation links */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                router.push("/dashboard");
                setMobileMenuOpen(false);
              }}
              className="w-full text-left text-gray-200 hover:text-white text-sm py-2.5 px-3 rounded-xl hover:bg-gray-800 transition font-medium"
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => {
                signOut({ callbackUrl: "/login" });
                setMobileMenuOpen(false);
              }}
              className="w-full text-left text-red-400 hover:text-red-300 text-sm py-2.5 px-3 rounded-xl hover:bg-red-500/10 transition font-medium"
            >
              🚪 Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}