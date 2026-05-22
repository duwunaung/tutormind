import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (session) {
    if (session.user?.role === "admin") {
      redirect("/admin");
    } else {
      redirect("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">

      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-white font-bold text-lg">TutorMind</h1>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-medium px-3 py-1 rounded-full mb-6">
          AI-Powered Lesson Planning
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 max-w-2xl leading-tight">
          Plan better lessons in half the time
        </h1>

        <p className="text-gray-400 text-lg mb-10 max-w-xl">
          TutorMind is an AI assistant built for independent tutors.
          Chat about your lesson, get a structured plan, download it instantly.
        </p>

        <div className="flex gap-3">
          <Link
            href="/register"
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-xl transition"
          >
            Start for Free →
          </Link>
          <Link
            href="/login"
            className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-6 py-3 rounded-xl transition"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        <FeatureCard
          icon="💬"
          title="Chat to Plan"
          description="Describe your lesson in plain language and let AI structure it for you."
        />
        <FeatureCard
          icon="📚"
          title="Subject Specialized"
          description="Math, Science, History, English, Software Engineering — AI adapts to your subject."
        />
        <FeatureCard
          icon="⬇️"
          title="Download Instantly"
          description="Export your lesson or course plan as a Word document, ready to use."
        />
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 px-6 py-4 text-center">
        <p className="text-gray-600 text-xs">© 2026 TutorMind. Built for independent tutors.</p>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
