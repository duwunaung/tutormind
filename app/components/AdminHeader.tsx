"use client";

import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="bg-gray-950 border-b border-gray-800 px-6 py-4 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div
            className="cursor-pointer"
            onClick={() => router.push("/admin")}
          >
            <h1 className="text-white font-bold text-base">TutorMind</h1>
            <p className="text-gray-500 text-xs">Admin Panel</p>
          </div>

          <nav className="flex items-center gap-2">
            <button
              onClick={() => router.push("/admin")}
              className={`text-sm px-3 py-1.5 rounded-lg transition font-medium ${
                pathname === "/admin"
                  ? "text-white bg-gray-900"
                  : "text-gray-400 hover:text-white hover:bg-gray-900/50"
              }`}
            >
              Users
            </button>
            <button
              onClick={() => router.push("/admin/prompts")}
              className={`text-sm px-3 py-1.5 rounded-lg transition font-medium ${
                pathname?.startsWith("/admin/prompts")
                  ? "text-white bg-gray-900"
                  : "text-gray-400 hover:text-white hover:bg-gray-900/50"
              }`}
            >
              Prompts
            </button>
          </nav>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-gray-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-gray-800 transition"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}