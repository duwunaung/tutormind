"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import AppHeader from "@/app/components/AppHeader";

type Section = {
  sectionNumber: number;
  title: string;
  duration: string;
  objectives: string[];
  description: string;
  activities: string;
  assessment: string;
};

type LessonPlan = {
  type: "lesson" | "course";
  title: string;
  subject: string;
  gradeLevel: string;
  // Lesson fields
  duration?: string;
  lessonStructure?: {
    introduction: { duration: string; description: string };
    mainActivity: { duration: string; description: string };
    wrapUp: { duration: string; description: string };
  };
  assessment?: string[];
  homework?: string;
  // Course fields
  totalDuration?: string;
  courseOverview?: string;
  sections?: Section[];
  finalAssessment?: string;
  // Shared
  objectives: string[];
  materials: string[];
  notes: string;
};

export default function LessonPlanPage() {
  const { sessionId } = useParams();
  const router = useRouter();
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [lessonPlanId, setLessonPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const generate = async () => {
      try {
        const res = await fetch("/api/lesson-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to generate lesson plan");
          return;
        }

        setLessonPlan(data.lessonPlan.structure);
        setLessonPlanId(data.lessonPlan.id);
      } catch (err) {
        console.error("Lesson plan fetch error:", err);
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    generate();
  }, [sessionId]);

  const handleDownload = async (format: "docx") => {
    if (!lessonPlanId) return;
    setDownloading(true);

    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonPlanId, format }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert("Failed to generate file. Please try again.");
        return;
      }

      const link = document.createElement("a");
      link.href = data.url;
      link.download = `lesson-plan.${format}`;
      link.click();
    } catch (err) {
      console.error("Download error:", err);
      alert("Something went wrong.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Generating your lesson plan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-blue-400 hover:underline text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!lessonPlan) return null;

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <AppHeader />
        {/* Plan Card */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">

          {/* Title Block */}
          <div className="bg-blue-600 px-6 py-5">
            <div className="mb-1">
              <span className="text-blue-200 text-xs font-medium uppercase tracking-wide">
                {lessonPlan.type === "course" ? "📘 Course Plan" : "📄 Lesson Plan"}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white">{lessonPlan.title}</h1>
            <div className="flex flex-wrap gap-4 mt-2 text-blue-100 text-sm">
              <span>📚 {lessonPlan.subject}</span>
              <span>🎓 {lessonPlan.gradeLevel}</span>
              <span>⏱ {lessonPlan.type === "course" ? lessonPlan.totalDuration : lessonPlan.duration}</span>
            </div>
          </div>

          <div className="p-6 space-y-6">

            {/* Course Overview */}
            {lessonPlan.type === "course" && lessonPlan.courseOverview && (
              <Section title="📋 Course Overview">
                <p className="text-gray-300 text-sm">{lessonPlan.courseOverview}</p>
              </Section>
            )}

            {/* Objectives */}
            <Section title="🎯 Learning Objectives">
              <ul className="space-y-2">
                {lessonPlan.objectives.map((obj, i) => (
                  <li key={i} className="flex gap-2 text-gray-300 text-sm">
                    <span className="text-blue-400 mt-0.5">•</span>
                    {obj}
                  </li>
                ))}
              </ul>
            </Section>

            {/* Materials */}
            <Section title="🧰 Materials Needed">
              <div className="flex flex-wrap gap-2">
                {lessonPlan.materials.map((mat, i) => (
                  <span
                    key={i}
                    className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full border border-gray-700"
                  >
                    {mat}
                  </span>
                ))}
              </div>
            </Section>

            {/* COURSE: Sections */}
            {lessonPlan.type === "course" && lessonPlan.sections && (
              <Section title={`📂 Course Sections (${lessonPlan.sections.length})`}>
                <div className="space-y-3">
                  {lessonPlan.sections.map((s, i) => (
                    <div
                      key={i}
                      className="bg-gray-800 border border-gray-700 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                            {s.sectionNumber}
                          </span>
                          <span className="text-white text-sm font-medium">{s.title}</span>
                        </div>
                        <span className="text-gray-400 text-xs shrink-0 ml-2">{s.duration}</span>
                      </div>
                      <p className="text-gray-400 text-xs mb-2">{s.description}</p>
                      {s.activities && (
                        <p className="text-gray-500 text-xs mb-2">
                          <span className="text-gray-400 font-medium">Activities: </span>
                          {s.activities}
                        </p>
                      )}
                      {s.assessment && (
                        <p className="text-gray-500 text-xs mb-2">
                          <span className="text-gray-400 font-medium">Assessment: </span>
                          {s.assessment}
                        </p>
                      )}
                      {s.objectives && s.objectives.length > 0 && (
                        <div className="mt-2 space-y-0.5">
                          {s.objectives.map((obj, j) => (
                            <p key={j} className="text-xs text-blue-300">• {obj}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* LESSON: Structure */}
            {lessonPlan.type === "lesson" && lessonPlan.lessonStructure && (
              <Section title="📋 Lesson Structure">
                <div className="space-y-3">
                  <StructureBlock
                    label="Introduction"
                    duration={lessonPlan.lessonStructure.introduction.duration}
                    description={lessonPlan.lessonStructure.introduction.description}
                    color="bg-green-500/10 border-green-500/20"
                  />
                  <StructureBlock
                    label="Main Activity"
                    duration={lessonPlan.lessonStructure.mainActivity.duration}
                    description={lessonPlan.lessonStructure.mainActivity.description}
                    color="bg-blue-500/10 border-blue-500/20"
                  />
                  <StructureBlock
                    label="Wrap Up"
                    duration={lessonPlan.lessonStructure.wrapUp.duration}
                    description={lessonPlan.lessonStructure.wrapUp.description}
                    color="bg-purple-500/10 border-purple-500/20"
                  />
                </div>
              </Section>
            )}

            {/* LESSON: Assessment */}
            {lessonPlan.type === "lesson" && lessonPlan.assessment && (
              <Section title="📝 Assessment Ideas">
                <ul className="space-y-2">
                  {lessonPlan.assessment.map((item, i) => (
                    <li key={i} className="flex gap-2 text-gray-300 text-sm">
                      <span className="text-green-400 mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* COURSE: Final Assessment */}
            {lessonPlan.type === "course" && lessonPlan.finalAssessment && (
              <Section title="🏆 Final Assessment">
                <p className="text-gray-300 text-sm">{lessonPlan.finalAssessment}</p>
              </Section>
            )}

            {/* LESSON: Homework */}
            {lessonPlan.type === "lesson" && lessonPlan.homework && (
              <Section title="🏠 Homework">
                <p className="text-gray-300 text-sm">{lessonPlan.homework}</p>
              </Section>
            )}

            {/* Notes */}
            {lessonPlan.notes && (
              <Section title="📌 Teacher Notes">
                <p className="text-gray-300 text-sm">{lessonPlan.notes}</p>
              </Section>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-white font-semibold text-sm mb-3">{title}</h2>
      {children}
    </div>
  );
}

function StructureBlock({
  label,
  duration,
  description,
  color,
}: {
  label: string;
  duration: string;
  description: string;
  color: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-white text-sm font-medium">{label}</span>
        <span className="text-gray-400 text-xs">{duration}</span>
      </div>
      <p className="text-gray-300 text-sm">{description}</p>
    </div>
  );
}