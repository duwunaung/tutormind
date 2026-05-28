"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import AppHeader from "@/app/components/AppHeader";
import AppFooter from "@/app/components/AppFooter";

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
  worksheet?: string;
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

  // Refinement widget state (toggles prompt input panel visibility)
  const [isEditing, setIsEditing] = useState(false);

  // Refinement states
  const [refinePrompt, setRefinePrompt] = useState("");
  const [refining, setRefining] = useState(false);
  const [refineError, setRefineError] = useState("");

  // Renaming state
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);

  const handleRenameSubmit = async () => {
    if (!renameValue.trim() || !lessonPlanId || !lessonPlan) return;
    setRenaming(true);
    try {
      const res = await fetch(`/api/lesson-plan/${lessonPlanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          structure: {
            ...lessonPlan,
            title: renameValue.trim(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to rename plan.");
        return;
      }

      setLessonPlan(data.lessonPlan.structure);
      setIsRenaming(false);
    } catch (err) {
      console.error("Rename error:", err);
      alert("Something went wrong.");
    } finally {
      setRenaming(false);
    }
  };

  const [generatingSection, setGeneratingSection] = useState<number | null>(null);

  const handleGenerateSectionPlan = async (section: Section) => {
    if (generatingSection !== null) return;
    setGeneratingSection(section.sectionNumber);

    try {
      const prompt = `Create a detailed lesson plan based on Section ${section.sectionNumber} of the course '${lessonPlan?.title}'.

Section Details:
- Title: ${section.title}
- Duration: ${section.duration}
- Description: ${section.description}
- Objectives: ${section.objectives?.join(", ") || ""}
- Activities: ${section.activities || ""}
- Assessment: ${section.assessment || ""}`;

      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Lesson Plan: ${section.title}`,
          messages: [{ role: "user", content: prompt }],
          subject: lessonPlan?.subject,
          planType: "lesson",
        }),
      });

      const data = await res.json();
      if (res.ok && data.sessionId) {
        router.push(`/lesson-plan/${data.sessionId}`);
      } else {
        alert(data.error || "Failed to initialize lesson plan for this section.");
      }
    } catch (err) {
      console.error("Section generation init error:", err);
      alert("Something went wrong.");
    } finally {
      setGeneratingSection(null);
    }
  };

  const [generatingWorksheet, setGeneratingWorksheet] = useState(false);
  const [activeTab, setActiveTab] = useState<"plan" | "worksheet">("plan");
  const [worksheetSubTab, setWorksheetSubTab] = useState<"handout" | "worksheet" | "homework" | "answerKey" | "full">("handout");
  const [copyStatus, setCopyStatus] = useState<"none" | "handout" | "worksheet" | "homework" | "answerKey" | "full">("none");

  const parseWorksheetContent = (text: string) => {
    if (!text) return { worksheet: "", homework: "", answerKey: "", full: "" };

    const content = text.replace(/\r\n/g, "\n");
    const homeworkMarker = "# Student Homework:";
    const keyMarker = "# Tutor Answer Key";

    let worksheet = "";
    let homework = "";
    let answerKey = "";

    const homeworkIdx = content.indexOf(homeworkMarker);
    const keyIdx = content.indexOf(keyMarker);

    if (homeworkIdx !== -1 && keyIdx !== -1) {
      worksheet = content.slice(0, homeworkIdx).trim();
      homework = content.slice(homeworkIdx, keyIdx).trim();
      answerKey = content.slice(keyIdx).trim();
    } else if (homeworkIdx !== -1) {
      worksheet = content.slice(0, homeworkIdx).trim();
      homework = content.slice(homeworkIdx).trim();
    } else if (keyIdx !== -1) {
      worksheet = content.slice(0, keyIdx).trim();
      answerKey = content.slice(keyIdx).trim();
    } else {
      worksheet = content.trim();
    }

    const cleanSection = (sec: string) => {
      return sec.replace(/\n\s*---\s*$/, "").trim();
    };

    return {
      worksheet: cleanSection(worksheet),
      homework: cleanSection(homework),
      answerKey: cleanSection(answerKey),
      full: content.trim(),
    };
  };

  const handleGenerateWorksheet = async () => {
    if (!lessonPlanId || generatingWorksheet) return;
    setGeneratingWorksheet(true);
    try {
      const res = await fetch(`/api/lesson-plan/${lessonPlanId}/worksheet`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to generate worksheet.");
        return;
      }
      setLessonPlan(data.lessonPlan.structure);
      setActiveTab("worksheet");
    } catch (err) {
      console.error("Worksheet generation error:", err);
      alert("Something went wrong.");
    } finally {
      setGeneratingWorksheet(false);
    }
  };

  const handleCopyText = (type: "handout" | "worksheet" | "homework" | "answerKey" | "full") => {
    const rawWorksheet = lessonPlan?.worksheet || "";
    if (!rawWorksheet) return;

    const parsed = parseWorksheetContent(rawWorksheet);
    let textToCopy = "";

    if (type === "handout") {
      textToCopy = `${parsed.worksheet}\n\n${parsed.homework}`.trim();
    } else if (type === "worksheet") {
      textToCopy = parsed.worksheet;
    } else if (type === "homework") {
      textToCopy = parsed.homework;
    } else if (type === "answerKey") {
      textToCopy = parsed.answerKey;
    } else {
      textToCopy = parsed.full;
    }

    navigator.clipboard.writeText(textToCopy);
    setCopyStatus(type);
    setTimeout(() => setCopyStatus("none"), 2000);
  };

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

  const handleRefine = async () => {
    if (!refinePrompt.trim() || refining || !lessonPlan) return;
    setRefining(true);
    setRefineError("");

    try {
      const res = await fetch("/api/lesson-plan/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          instruction: refinePrompt,
          currentStructure: lessonPlan,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRefineError(data.error || "Failed to adjust plan");
        return;
      }

      setLessonPlan(data.lessonPlan.structure);
      setRefinePrompt("");
      setIsEditing(false); // Close refinement panel on success
    } catch (err) {
      console.error("Refine error:", err);
      setRefineError("Something went wrong. Please try again.");
    } finally {
      setRefining(false);
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
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <AppHeader
          actions={
            isEditing ? (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setRefinePrompt("");
                    setRefineError("");
                  }}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-1.5 rounded-lg border border-gray-700 transition font-medium cursor-pointer"
                >
                  ❌ Close Refine
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setRefinePrompt("");
                    setRefineError("");
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-1.5 rounded-lg transition font-medium cursor-pointer shadow-lg shadow-blue-600/15"
                >
                  ✨ Refine with AI
                </button>
                <button
                  onClick={() => handleDownload("docx")}
                  disabled={downloading || !lessonPlanId}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-1.5 rounded-lg border border-gray-700 transition font-medium cursor-pointer"
                >
                  {downloading ? "Generating..." : "⬇ Download DOCX"}
                </button>
              </div>
            )
          }
        />

        <div className="max-w-3xl w-full mx-auto px-4 py-6 sm:py-8 flex-1 flex flex-col justify-start">

        {/* Plan Card */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">

          {/* Title Block */}
          <div className="bg-blue-600 px-6 py-5">
            <div className="mb-1 flex justify-between items-start">
              <span className="text-blue-200 text-xs font-medium uppercase tracking-wide">
                {lessonPlan.type === "course" ? "📘 Course Plan" : "📄 Lesson Plan"}
              </span>
            </div>

            {isRenaming ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="bg-blue-700 text-white text-lg font-bold rounded px-2 py-1 w-full max-w-lg border border-blue-500 focus:outline-none focus:ring-1 focus:ring-white"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRenameSubmit();
                    if (e.key === "Escape") setIsRenaming(false);
                  }}
                />
                <button
                  onClick={handleRenameSubmit}
                  disabled={renaming}
                  className="bg-white text-blue-600 text-xs px-3 py-1.5 rounded-lg transition font-semibold hover:bg-blue-50 cursor-pointer disabled:opacity-50"
                >
                  {renaming ? "..." : "Save"}
                </button>
                <button
                  onClick={() => setIsRenaming(false)}
                  className="text-blue-200 hover:text-white text-xs px-2 py-1.5 transition font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group mt-1">
                <h1 className="text-xl font-bold text-white leading-tight">{lessonPlan.title}</h1>
                <button
                  onClick={() => {
                    setIsRenaming(true);
                    setRenameValue(lessonPlan.title);
                  }}
                  className="text-blue-200 hover:text-white text-sm cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity font-semibold"
                  title="Rename Plan"
                >
                  ✏️
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-4 mt-2 text-blue-100 text-sm">
              <span>📚 {lessonPlan.subject}</span>
              <span>🎓 {lessonPlan.gradeLevel}</span>
              <span>⏱ {lessonPlan.type === "course" ? lessonPlan.totalDuration : lessonPlan.duration}</span>
            </div>
          </div>

          {/* Tab Selector (only visible if worksheet exists) */}
          {lessonPlan.worksheet && (
            <div className="flex border-b border-gray-800 bg-gray-950/30 px-6 select-none overflow-x-auto">
              <button
                onClick={() => setActiveTab("plan")}
                className={`py-3 px-4 text-xs font-bold tracking-wider uppercase border-b-2 transition duration-200 cursor-pointer whitespace-nowrap ${
                  activeTab === "plan"
                    ? "border-blue-500 text-white"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                📋 Lesson Plan Outline
              </button>
              <button
                onClick={() => setActiveTab("worksheet")}
                className={`py-3 px-4 text-xs font-bold tracking-wider uppercase border-b-2 transition duration-200 cursor-pointer whitespace-nowrap ${
                  activeTab === "worksheet"
                    ? "border-blue-500 text-white"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                📄 Student Handouts & Homework
              </button>
            </div>
          )}

          <div className="p-6">

            {/* AI Refinement Widget inside Edit mode */}
            {isEditing && (
              <div className="bg-blue-600/5 border border-blue-500/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span>✨</span> Quick AI Refinement
                  </h3>
                  <span className="text-blue-400 text-[10px] font-semibold">Refines all fields below</span>
                </div>
                <div className="flex gap-2 items-start">
                  <textarea
                    value={refinePrompt}
                    onChange={(e) => setRefinePrompt(e.target.value)}
                    placeholder="Enter instructions for AI to update the plan (e.g. 'Add a hands-on project to section 3')..."
                    rows={2}
                    disabled={refining}
                    className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <button
                    onClick={handleRefine}
                    disabled={refining || !refinePrompt.trim()}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white text-xs px-4 py-3 sm:py-2.5 rounded-xl transition font-semibold cursor-pointer shrink-0 h-[40px] flex items-center justify-center"
                  >
                    {refining ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Refining...
                      </span>
                    ) : (
                      "Apply ✨"
                    )}
                  </button>
                </div>
                {refineError && (
                  <p className="text-red-400 text-xs">⚠️ {refineError}</p>
                )}
              </div>
            )}

            {activeTab === "plan" && (
              <div className="space-y-6">
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
                {lessonPlan.type === "course" && (
                  <Section title={`📂 Course Sections (${lessonPlan.sections?.length || 0})`}>
                    <div className="space-y-3">
                      {lessonPlan.sections?.map((s, i) => (
                        <div
                          key={i}
                          className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-blue-500/30 transition duration-200"
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
                          <div className="mt-3 flex justify-end border-t border-gray-700/50 pt-3">
                            <button
                              onClick={() => handleGenerateSectionPlan(s)}
                              disabled={generatingSection !== null}
                              className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs px-3 py-1.5 rounded-lg transition font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              {generatingSection === s.sectionNumber ? (
                                <>
                                  <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                  Preparing...
                                </>
                              ) : (
                                <>
                                  <span>⚡</span> Generate Lesson Plan
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* LESSON: Structure */}
                {lessonPlan.type === "lesson" && (
                  <Section title="📋 Lesson Structure">
                    <div className="space-y-3">
                      <StructureBlock
                        label="Introduction"
                        duration={lessonPlan.lessonStructure?.introduction.duration || ""}
                        description={lessonPlan.lessonStructure?.introduction.description || ""}
                        color="bg-green-500/10 border-green-500/20"
                      />
                      <StructureBlock
                        label="Main Activity"
                        duration={lessonPlan.lessonStructure?.mainActivity.duration || ""}
                        description={lessonPlan.lessonStructure?.mainActivity.description || ""}
                        color="bg-blue-500/10 border-blue-500/20"
                      />
                      <StructureBlock
                        label="Wrap Up"
                        duration={lessonPlan.lessonStructure?.wrapUp.duration || ""}
                        description={lessonPlan.lessonStructure?.wrapUp.description || ""}
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

                {/* Generate Worksheet Block (only if worksheet does not exist) */}
                {!lessonPlan.worksheet && (
                  <div className="mt-8 border-t border-gray-800 pt-6">
                    <div className="bg-gradient-to-r from-blue-600/5 to-indigo-600/5 border border-blue-500/10 rounded-2xl p-6 text-center">
                      <p className="text-2xl mb-3 select-none">📝</p>
                      <h3 className="text-white font-bold text-base mb-1">Generate Student Handouts & Homework</h3>
                      <p className="text-gray-400 text-xs max-w-md mx-auto mb-5 leading-relaxed">
                        Create printable explanations, solved examples, classroom practice problems, and assignments tailored to this plan.
                      </p>
                      <button
                        onClick={handleGenerateWorksheet}
                        disabled={generatingWorksheet}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition duration-250 cursor-pointer shadow-lg shadow-blue-600/15"
                      >
                        {generatingWorksheet ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Generating Handout...
                          </span>
                        ) : (
                          "⚡ Generate Handout & Homework"
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Render Worksheet Content */}
            {activeTab === "worksheet" && lessonPlan.worksheet && (() => {
              const parsedWorksheet = parseWorksheetContent(lessonPlan.worksheet);
              return (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Worksheet Sub-tabs (interactive layout) */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-3 no-print select-none">
                    <div className="flex flex-wrap gap-1 bg-gray-950/45 p-1 rounded-xl border border-gray-800/80">
                      <button
                        onClick={() => setWorksheetSubTab("handout")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                          worksheetSubTab === "handout"
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                            : "text-gray-400 hover:text-gray-200"
                        }`}
                      >
                        📄 Student Handout
                      </button>
                      <button
                        onClick={() => setWorksheetSubTab("worksheet")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                          worksheetSubTab === "worksheet"
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                            : "text-gray-400 hover:text-gray-200"
                        }`}
                      >
                        📖 Worksheet Only
                      </button>
                      <button
                        onClick={() => setWorksheetSubTab("homework")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                          worksheetSubTab === "homework"
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                            : "text-gray-400 hover:text-gray-200"
                        }`}
                      >
                        🏠 Homework Only
                      </button>
                      <button
                        onClick={() => setWorksheetSubTab("answerKey")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                          worksheetSubTab === "answerKey"
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                            : "text-gray-400 hover:text-gray-200"
                        }`}
                      >
                        🔑 Answer Key
                      </button>
                      <button
                        onClick={() => setWorksheetSubTab("full")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                          worksheetSubTab === "full"
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                            : "text-gray-400 hover:text-gray-200"
                        }`}
                      >
                        📑 Full View
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyText(worksheetSubTab)}
                        className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-xs px-3.5 py-2 rounded-xl transition font-semibold cursor-pointer flex items-center gap-1.5"
                      >
                        📋 {copyStatus === worksheetSubTab ? "Copied! ✓" : "Copy Current"}
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-xl font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-blue-600/10"
                      >
                        🖨️ Print / Save PDF
                      </button>
                    </div>
                  </div>

                  {/* A4 Paper Document mockup */}
                  <div
                    id="printable-worksheet"
                    className="bg-white text-gray-900 border border-gray-200/80 shadow-2xl p-8 md:p-14 max-w-[850px] mx-auto rounded-2xl min-h-[1100px] relative font-sans select-text"
                  >
                    {/* Style injection for printing (hides other dashboard UI elements) */}
                    <style dangerouslySetInnerHTML={{__html: `
                      @media print {
                        body {
                          background: white !important;
                          color: black !important;
                        }
                        /* Hide all page content by default */
                        body * {
                          visibility: hidden;
                        }
                        /* Only display the printable sheet container and its descendants */
                        #printable-worksheet, #printable-worksheet * {
                          visibility: visible;
                        }
                        #printable-worksheet {
                          position: absolute;
                          left: 0;
                          top: 0;
                          width: 100% !important;
                          max-width: 100% !important;
                          padding: 1.5cm !important;
                          margin: 0 !important;
                          box-shadow: none !important;
                          border: none !important;
                          background: white !important;
                          color: black !important;
                        }
                        .no-print {
                          display: none !important;
                        }
                        .page-break {
                          page-break-before: always !important;
                          break-before: page !important;
                        }
                      }
                    `}} />

                    {/* Header Banner - print and screen-friendly layout */}
                    <div className="border-b-2 border-gray-900 pb-5 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                      <div>
                        <span className="text-[10px] font-extrabold tracking-widest text-blue-600 uppercase">TutorMind Handout Series</span>
                        <h2 className="text-2xl font-black text-gray-900 mt-1 tracking-tight leading-tight">{lessonPlan.title}</h2>
                      </div>
                      <div className="text-left md:text-right text-xs text-gray-500 font-medium">
                        <div>Subject: <span className="font-semibold text-gray-800">{lessonPlan.subject}</span></div>
                        <div>Level: <span className="font-semibold text-gray-800">{lessonPlan.gradeLevel}</span></div>
                      </div>
                    </div>

                    {/* Confidential Warning Alert for Tutor Answer Key */}
                    {worksheetSubTab === "answerKey" && (
                      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl mb-8 flex items-center gap-3">
                        <span className="text-xl">🔐</span>
                        <div>
                          <h4 className="text-red-900 font-extrabold text-xs uppercase tracking-wider">Confidential Answer Key</h4>
                          <p className="text-red-750 text-xs mt-0.5 font-medium">For tutor grading use only. Do not distribute to students.</p>
                        </div>
                      </div>
                    )}

                    {/* Student Metadata box - hidden for Answer Key */}
                    {worksheetSubTab !== "answerKey" && (
                      <div className="grid grid-cols-2 gap-6 border border-gray-200/80 rounded-xl p-4 bg-gray-50/50 mb-8 text-xs text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-700 whitespace-nowrap">Student Name:</span>
                          <div className="flex-1 border-b border-gray-300 h-4 border-dashed" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-700 whitespace-nowrap">Date:</span>
                          <div className="flex-1 border-b border-gray-300 h-4 border-dashed" />
                        </div>
                      </div>
                    )}

                    {/* Worksheet body rendering based on sub-tab */}
                    <div className="prose prose-slate max-w-none">
                      {worksheetSubTab === "handout" && (
                        <div className="space-y-12">
                          <div>
                            <MarkdownRenderer content={parsedWorksheet.worksheet} />
                          </div>
                          <div className="border-t border-dashed border-gray-300 pt-8 mt-8 page-break no-print" />
                          <div className="page-break" />
                          <div>
                            <MarkdownRenderer content={parsedWorksheet.homework} />
                          </div>
                        </div>
                      )}

                      {worksheetSubTab === "worksheet" && (
                        <MarkdownRenderer content={parsedWorksheet.worksheet} />
                      )}

                      {worksheetSubTab === "homework" && (
                        <MarkdownRenderer content={parsedWorksheet.homework} />
                      )}

                      {worksheetSubTab === "answerKey" && (
                        <MarkdownRenderer content={parsedWorksheet.answerKey} />
                      )}

                      {worksheetSubTab === "full" && (
                        <div className="space-y-12">
                          <div>
                            <MarkdownRenderer content={parsedWorksheet.worksheet} />
                          </div>
                          <div className="border-t border-dashed border-gray-300 pt-8 mt-8 page-break" />
                          <div>
                            <MarkdownRenderer content={parsedWorksheet.homework} />
                          </div>
                          <div className="border-t border-dashed border-gray-300 pt-8 mt-8 page-break" />
                          <div className="bg-red-50/20 p-4 rounded-xl border border-red-100 mb-6 no-print">
                            <span className="text-red-700 font-bold text-xs uppercase tracking-wider">Answer Key Section Below</span>
                          </div>
                          <div>
                            <MarkdownRenderer content={parsedWorksheet.answerKey} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>
        </div>

      </div>

      <AppFooter />
    </div>
  );
}

// Helper Components
function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-semibold text-sm">{title}</h2>
        {action}
      </div>
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

function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const elements: React.ReactNode[] = [];
  
  let currentParagraph: string[] = [];
  let currentList: string[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  const flushParagraph = (key: string) => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(" ");
      elements.push(
        <p key={key} className="mb-4 text-gray-800 leading-relaxed text-sm select-text">
          {parseInlineFormatting(text)}
        </p>
      );
      currentParagraph = [];
    }
  };

  const flushList = (key: string) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={key} className="list-disc pl-5 mb-4 space-y-2">
          {currentList.map((item, idx) => (
            <li key={idx} className="text-gray-800 text-sm leading-relaxed select-text">
              {parseInlineFormatting(item)}
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        const codeText = codeBlockLines.join("\n");
        elements.push(
          <div key={`code-${i}`} className="bg-gray-900 border border-gray-800 rounded-xl p-4 my-4 font-mono text-xs text-gray-200 overflow-x-auto whitespace-pre select-all">
            {codeText}
          </div>
        );
        inCodeBlock = false;
        codeBlockLines = [];
      } else {
        flushParagraph(`p-before-code-${i}`);
        flushList(`l-before-code-${i}`);
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    if (trimmed === "---" || trimmed === "***") {
      flushParagraph(`p-before-hr-${i}`);
      flushList(`l-before-hr-${i}`);
      elements.push(<hr key={`hr-${i}`} className="my-6 border-gray-200" />);
      continue;
    }

    if (trimmed.startsWith("# ")) {
      flushParagraph(`p-before-h1-${i}`);
      flushList(`l-before-h1-${i}`);
      elements.push(
        <h1 key={`h1-${i}`} className="text-2xl font-black text-gray-900 tracking-tight border-b-2 border-gray-150 pb-2 mt-8 mb-4 first:mt-2 select-text">
          {trimmed.substring(2)}
        </h1>
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushParagraph(`p-before-h2-${i}`);
      flushList(`l-before-h2-${i}`);
      elements.push(
        <h2 key={`h2-${i}`} className="text-xl font-bold text-gray-800 mt-6 mb-3 select-text">
          {trimmed.substring(3)}
        </h2>
      );
      continue;
    }
    if (trimmed.startsWith("### ")) {
      flushParagraph(`p-before-h3-${i}`);
      flushList(`l-before-h3-${i}`);
      elements.push(
        <h3 key={`h3-${i}`} className="text-lg font-bold text-gray-700 mt-5 mb-2 select-text">
          {trimmed.substring(4)}
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith("> ")) {
      flushParagraph(`p-before-bq-${i}`);
      flushList(`l-before-bq-${i}`);
      elements.push(
        <blockquote key={`bq-${i}`} className="border-l-4 border-blue-500 pl-4 py-1 italic text-gray-650 bg-blue-50/20 my-4 rounded-r-md select-text">
          {parseInlineFormatting(line.substring(2))}
        </blockquote>
      );
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
      flushParagraph(`p-before-li-${i}`);
      currentList.push(trimmed.substring(2));
      continue;
    }

    if (trimmed === "") {
      flushParagraph(`p-blank-${i}`);
      flushList(`l-blank-${i}`);
      continue;
    }

    flushList(`l-para-${i}`);
    currentParagraph.push(line);
  }

  flushParagraph("p-final");
  flushList("l-final");

  return <div className="space-y-1">{elements}</div>;
}

function parseInlineFormatting(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  const splitParts = text.split(regex);

  splitParts.forEach((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      parts.push(
        <strong key={index} className="font-semibold text-gray-900 bg-blue-50 px-1 py-0.5 rounded text-xs select-text">
          {part.slice(2, -2)}
        </strong>
      );
    } else if (part.startsWith("*") && part.endsWith("*")) {
      parts.push(<em key={index} className="italic select-text">{part.slice(1, -1)}</em>);
    } else if (part.startsWith("`") && part.endsWith("`")) {
      parts.push(
        <code key={index} className="bg-gray-100 text-red-650 font-mono text-xs px-1.5 py-0.5 rounded border border-gray-200 select-all">
          {part.slice(1, -1)}
        </code>
      );
    } else {
      parts.push(<span key={index} className="select-text">{part}</span>);
    }
  });

  return parts;
}