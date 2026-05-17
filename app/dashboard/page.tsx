import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-gray-900">
        Welcome, {session.user?.name}! 👋
      </h1>
      <p className="text-gray-500 mt-1">
        Subject: {(session.user as any).subject} | Grade: {(session.user as any).gradeLevel}
      </p>
    </div>
  );
}