import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">
          Welcome, {session.user?.name}! 👋
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          Subject: {(session.user as any).subject} · Grade:{" "}
          {(session.user as any).gradeLevel}
        </p>

        <Link
          href="/chat"
          className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-xl transition"
        >
          + Start New Session
        </Link>
      </div>
    </div>
  );
}