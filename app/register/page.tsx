"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const DEFAULT_SUBJECTS = ["Math", "Science", "English / Language Arts", "History", "Software Engineering"];
const GRADE_LEVELS = [
  "Elementary (K-5)",
  "Middle School (6-8)",
  "High School (9-12)",
  "College / Adult",
];

export default function RegisterPage() {
  const router = useRouter();
  const [subjectsList, setSubjectsList] = useState<string[]>(DEFAULT_SUBJECTS);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    subject: "",
    gradeLevel: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await fetch("/api/subjects");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.subjects) && data.subjects.length > 0) {
            setSubjectsList(data.subjects);
          }
        }
      } catch (err) {
        console.error("Failed to fetch subjects from DB, using fallback list:", err);
      }
    };
    fetchSubjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const hasUppercase = /[A-Z]/.test(form.password);
    const hasNumber = /[0-9]/.test(form.password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(form.password);

    if (form.password.length < 8 || !hasUppercase || !hasNumber || !hasSpecialChar) {
      setError("Password does not meet complexity requirements.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    router.push("/login?registered=true");
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
        <p className="text-gray-400 text-sm mb-6">Start planning better lessons with AI</p>

        {error && (
          <div className="bg-red-500/10 text-red-400 text-sm rounded-lg p-3 mb-4 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Jane Smith"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="jane@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter strong password"
            />
            {form.password && (
              <div className="mt-2 space-y-1 text-[11px] bg-gray-950/40 p-2.5 rounded-lg border border-gray-800/60">
                <div className={`flex items-center gap-1.5 transition-colors duration-200 ${form.password.length >= 8 ? "text-green-400" : "text-gray-500"}`}>
                  <span>{form.password.length >= 8 ? "✓" : "○"}</span>
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 transition-colors duration-200 ${/[A-Z]/.test(form.password) ? "text-green-400" : "text-gray-500"}`}>
                  <span>{/[A-Z]/.test(form.password) ? "✓" : "○"}</span>
                  <span>At least one uppercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 transition-colors duration-200 ${/[0-9]/.test(form.password) ? "text-green-400" : "text-gray-500"}`}>
                  <span>{/[0-9]/.test(form.password) ? "✓" : "○"}</span>
                  <span>At least one number</span>
                </div>
                <div className={`flex items-center gap-1.5 transition-colors duration-200 ${/[^A-Za-z0-9]/.test(form.password) ? "text-green-400" : "text-gray-500"}`}>
                  <span>{/[^A-Za-z0-9]/.test(form.password) ? "✓" : "○"}</span>
                  <span>At least one special character</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Subject</label>
            <select
              required
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="" className="text-gray-500">Select a subject</option>
              {subjectsList.map((s) => (
                <option key={s} value={s} className="text-white">{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Grade Level</label>
            <select
              required
              value={form.gradeLevel}
              onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="" className="text-gray-500">Select grade level</option>
              {GRADE_LEVELS.map((g) => (
                <option key={g} value={g} className="text-white">{g}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg py-2 text-sm transition disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300">Sign in</Link>
        </p>
      </div>
    </div>
  );
}