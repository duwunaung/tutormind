"use client";

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

  const user = session?.user as { subject?: string; gradeLevel?: string } | undefined;
  const subject = user?.subject || "";
  const gradeLevel = user?.gradeLevel || "";

  return (
    <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 sticky top-0 z-10">
      <div className="max-w-3xl mx-auto flex items-center justify-between">

        {/* Left — Logo + subtitle */}
        <div
          className="cursor-pointer"
          onClick={() => router.push("/dashboard")}
        >
          <h1 className="text-white font-bold text-base">TutorMind</h1>
          {subject && (
            <p className="text-gray-400 text-xs">
              {subject}{gradeLevel ? ` · ${gradeLevel}` : ""}
            </p>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">

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
            className="text-gray-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-gray-800 transition"
          >
            Dashboard
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-gray-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-gray-800 transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}