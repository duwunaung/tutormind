"use client";

import { signOut } from "next-auth/react";

export default function SuspendedPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-6">🚫</div>
        <h1 className="text-white text-xl font-bold mb-2">Account Suspended</h1>
        <p className="text-gray-400 text-sm mb-8">
          Your account has been disabled. Please contact support if you believe
          this is a mistake.
        </p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="bg-gray-800 hover:bg-gray-700 text-white text-sm px-5 py-2.5 rounded-xl transition"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}