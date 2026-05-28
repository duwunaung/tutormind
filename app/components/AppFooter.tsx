"use client";

export default function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-900/60 bg-gray-950 py-6 px-4 mt-auto w-full select-none">
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
        <p className="text-center sm:text-left">
          © {currentYear} TutorMind. All rights reserved.
        </p>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="font-medium text-gray-400">System Active</span>
          <span className="text-gray-700">|</span>
          <span className="font-mono bg-gray-900 border border-gray-800/80 text-gray-400 rounded-md px-2 py-0.5">
            v1.1.2
          </span>
        </div>
      </div>
    </footer>
  );
}
