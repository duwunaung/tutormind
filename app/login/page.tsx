"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password");
      return;
    }

    const session = await getSession();
    if (session?.user?.role === "admin") {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      {/* Branding and Logo Header */}
      <div className="flex flex-col items-center mb-6 select-none text-center">
        <Image
          src="/apple-icon.png"
          alt="TutorMind Logo"
          width={64}
          height={64}
          className="rounded-2xl shadow-lg shadow-blue-500/10 mb-3.5 border border-gray-800"
        />
        <h2 className="text-2xl font-bold text-white tracking-tight">TutorMind</h2>
        <p className="text-[11px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">AI-Powered Tutoring Assistant</p>
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-md p-8 shadow-xl">
        <h1 className="text-xl font-bold text-white mb-1">Welcome back</h1>
        <p className="text-gray-400 text-xs mb-6 font-medium">Sign in to your TutorMind account</p>

        {error && (
          <div className="bg-red-500/10 text-red-400 text-sm rounded-lg p-3 mb-4 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="jane@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl py-2.5 text-sm transition duration-200 cursor-pointer shadow-lg shadow-blue-600/15 disabled:opacity-50 mt-2"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6 font-medium">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-blue-400 hover:text-blue-300 transition">Register</Link>
        </p>
      </div>
    </div>
  );
}