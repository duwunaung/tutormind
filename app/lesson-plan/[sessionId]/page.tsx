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

  // Editor states
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState<LessonPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Warn user about unsaved changes when closing the page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isEditing) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isEditing]);

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

  const handleSave = async () => {
    if (!editedPlan || !lessonPlanId) return;

    if (!editedPlan.title.trim()) {
      setSaveError("Title is required");
      return;
    }
    if (!editedPlan.subject.trim()) {
      setSaveError("Subject is required");
      return;
    }
    if (!editedPlan.gradeLevel.trim()) {
      setSaveError("Grade level is required");
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      const res = await fetch(`/api/lesson-plan/${lessonPlanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ structure: editedPlan }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSaveError(data.error || "Failed to save changes");
        return;
      }

      setLessonPlan(data.lessonPlan.structure);
      setIsEditing(false);
    } catch (err) {
      console.error("Save error:", err);
      setSaveError("Something went wrong while saving");
    } finally {
      setSaving(false);
    }
  };

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
        <AppHeader
          actions={
            isEditing ? (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm px-4 py-1.5 rounded-lg transition font-medium"
                >
                  {saving ? "Saving..." : "💾 Save Changes"}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedPlan(null);
                    setSaveError("");
                  }}
                  disabled={saving}
                  className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 text-sm px-4 py-1.5 rounded-lg border border-gray-700 transition"
                >
                  ❌ Cancel
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditedPlan(JSON.parse(JSON.stringify(lessonPlan)));
                    setIsEditing(true);
                    setSaveError("");
                  }}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-1.5 rounded-lg border border-gray-700 transition font-medium"
                >
                  ✏️ Edit Plan
                </button>
                <button
                  onClick={() => handleDownload("docx")}
                  disabled={downloading || !lessonPlanId}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm px-4 py-1.5 rounded-lg transition font-medium"
                >
                  {downloading ? "Generating..." : "⬇ Download DOCX"}
                </button>
              </div>
            )
          }
        />

        {saveError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-sm px-4 py-2.5 rounded-xl mb-4 text-center">
            ⚠️ {saveError}
          </div>
        )}

        {/* Plan Card */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">

          {/* Title Block */}
          <div className="bg-blue-600 px-6 py-5">
            <div className="mb-1">
              <span className="text-blue-200 text-xs font-medium uppercase tracking-wide">
                {lessonPlan.type === "course" ? "📘 Course Plan" : "📄 Lesson Plan"}
              </span>
            </div>
            {isEditing && editedPlan ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editedPlan.title}
                  onChange={(e) => setEditedPlan({ ...editedPlan, title: e.target.value })}
                  placeholder="Plan Title"
                  className="bg-blue-700 border border-blue-500 rounded-lg text-white text-lg font-bold px-3 py-1.5 outline-none w-full placeholder-blue-300 focus:border-white focus:ring-1 focus:ring-white transition"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-blue-100 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="shrink-0">📚</span>
                    <input
                      type="text"
                      value={editedPlan.subject}
                      onChange={(e) => setEditedPlan({ ...editedPlan, subject: e.target.value })}
                      placeholder="Subject"
                      className="bg-blue-700 border border-blue-500 rounded text-white text-xs px-2 py-1 outline-none w-full focus:border-white transition"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="shrink-0">🎓</span>
                    <input
                      type="text"
                      value={editedPlan.gradeLevel}
                      onChange={(e) => setEditedPlan({ ...editedPlan, gradeLevel: e.target.value })}
                      placeholder="Grade Level"
                      className="bg-blue-700 border border-blue-500 rounded text-white text-xs px-2 py-1 outline-none w-full focus:border-white transition"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="shrink-0">⏱</span>
                    <input
                      type="text"
                      value={editedPlan.type === "course" ? (editedPlan.totalDuration || "") : (editedPlan.duration || "")}
                      onChange={(e) => {
                        if (editedPlan.type === "course") {
                          setEditedPlan({ ...editedPlan, totalDuration: e.target.value });
                        } else {
                          setEditedPlan({ ...editedPlan, duration: e.target.value });
                        }
                      }}
                      placeholder="Duration"
                      className="bg-blue-700 border border-blue-500 rounded text-white text-xs px-2 py-1 outline-none w-full focus:border-white transition"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-xl font-bold text-white">{lessonPlan.title}</h1>
                <div className="flex flex-wrap gap-4 mt-2 text-blue-100 text-sm">
                  <span>📚 {lessonPlan.subject}</span>
                  <span>🎓 {lessonPlan.gradeLevel}</span>
                  <span>⏱ {lessonPlan.type === "course" ? lessonPlan.totalDuration : lessonPlan.duration}</span>
                </div>
              </>
            )}
          </div>

          <div className="p-6 space-y-6">

            {/* Course Overview */}
            {lessonPlan.type === "course" && (lessonPlan.courseOverview || isEditing) && (
              <Section title="📋 Course Overview">
                {isEditing && editedPlan ? (
                  <textarea
                    value={editedPlan.courseOverview || ""}
                    onChange={(e) => setEditedPlan({ ...editedPlan, courseOverview: e.target.value })}
                    className="bg-gray-800 border border-gray-700/80 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white text-sm outline-none px-4 py-2 w-full h-24 resize-y transition duration-200"
                    placeholder="Course overview description..."
                  />
                ) : (
                  <p className="text-gray-300 text-sm">{lessonPlan.courseOverview}</p>
                )}
              </Section>
            )}

            {/* Objectives */}
            <Section
              title="🎯 Learning Objectives"
              action={
                isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      const updatedObj = [...(editedPlan?.objectives || [])];
                      updatedObj.push("");
                      setEditedPlan({ ...editedPlan!, objectives: updatedObj });
                    }}
                    className="text-xs bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 px-3 py-1 rounded-lg transition font-medium"
                  >
                    ➕ Add Objective
                  </button>
                )
              }
            >
              {isEditing && editedPlan ? (
                <div className="space-y-2">
                  {editedPlan.objectives.map((obj, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <span className="text-blue-400 font-medium shrink-0">•</span>
                      <input
                        type="text"
                        value={obj}
                        onChange={(e) => {
                          const updatedObj = [...editedPlan.objectives];
                          updatedObj[i] = e.target.value;
                          setEditedPlan({ ...editedPlan, objectives: updatedObj });
                        }}
                        className="bg-gray-800 border border-gray-700/80 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white text-sm outline-none px-4 py-2 w-full transition duration-200"
                        placeholder={`Objective ${i + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updatedObj = editedPlan.objectives.filter((_, idx) => idx !== i);
                          setEditedPlan({ ...editedPlan, objectives: updatedObj });
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-xl transition shrink-0"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                  {editedPlan.objectives.length === 0 && (
                    <p className="text-gray-500 text-xs italic">No objectives. Click &quot;Add Objective&quot; to add one.</p>
                  )}
                </div>
              ) : (
                <ul className="space-y-2">
                  {lessonPlan.objectives.map((obj, i) => (
                    <li key={i} className="flex gap-2 text-gray-300 text-sm">
                      <span className="text-blue-400 mt-0.5">•</span>
                      {obj}
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* Materials */}
            <Section
              title="🧰 Materials Needed"
              action={
                isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      const updatedMat = [...(editedPlan?.materials || [])];
                      updatedMat.push("");
                      setEditedPlan({ ...editedPlan!, materials: updatedMat });
                    }}
                    className="text-xs bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 px-3 py-1 rounded-lg transition font-medium"
                  >
                    ➕ Add Material
                  </button>
                )
              }
            >
              {isEditing && editedPlan ? (
                <div className="space-y-2">
                  {editedPlan.materials.map((mat, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <span className="text-blue-400 font-medium shrink-0">•</span>
                      <input
                        type="text"
                        value={mat}
                        onChange={(e) => {
                          const updatedMat = [...editedPlan.materials];
                          updatedMat[i] = e.target.value;
                          setEditedPlan({ ...editedPlan, materials: updatedMat });
                        }}
                        className="bg-gray-800 border border-gray-700/80 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white text-sm outline-none px-4 py-2 w-full transition duration-200"
                        placeholder={`Material ${i + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updatedMat = editedPlan.materials.filter((_, idx) => idx !== i);
                          setEditedPlan({ ...editedPlan, materials: updatedMat });
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-xl transition shrink-0"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                  {editedPlan.materials.length === 0 && (
                    <p className="text-gray-500 text-xs italic">No materials. Click &quot;Add Material&quot; to add one.</p>
                  )}
                </div>
              ) : (
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
              )}
            </Section>

            {/* COURSE: Sections */}
            {lessonPlan.type === "course" && (
              <Section
                title={`📂 Course Sections (${isEditing && editedPlan ? (editedPlan.sections?.length || 0) : (lessonPlan.sections?.length || 0)})`}
                action={
                  isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        const updatedSecs = [...(editedPlan?.sections || [])];
                        updatedSecs.push({
                          sectionNumber: updatedSecs.length + 1,
                          title: "",
                          duration: "",
                          objectives: [],
                          description: "",
                          activities: "",
                          assessment: "",
                        });
                        setEditedPlan({ ...editedPlan!, sections: updatedSecs });
                      }}
                      className="text-xs bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 px-3 py-1 rounded-lg transition font-medium"
                    >
                      ➕ Add Section
                    </button>
                  )
                }
              >
                {isEditing && editedPlan ? (
                  <div className="space-y-4">
                    {editedPlan.sections?.map((s, i) => (
                      <div
                        key={i}
                        className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3"
                      >
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex items-center gap-2 w-full">
                            <span className="bg-blue-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                            <input
                              type="text"
                              value={s.title}
                              onChange={(e) => {
                                const updatedSecs = [...editedPlan.sections!];
                                updatedSecs[i] = { ...s, title: e.target.value };
                                setEditedPlan({ ...editedPlan, sections: updatedSecs });
                              }}
                              placeholder="Section Title"
                              className="bg-gray-900 border border-gray-700/80 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white text-sm outline-none px-3 py-1 w-full transition"
                            />
                          </div>
                          <input
                            type="text"
                            value={s.duration}
                            onChange={(e) => {
                              const updatedSecs = [...editedPlan.sections!];
                              updatedSecs[i] = { ...s, duration: e.target.value };
                              setEditedPlan({ ...editedPlan, sections: updatedSecs });
                            }}
                            placeholder="Duration"
                            className="bg-gray-900 border border-gray-700/80 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white text-sm outline-none px-3 py-1 w-32 shrink-0 transition"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updatedSecs = editedPlan.sections!
                                .filter((_, idx) => idx !== i)
                                .map((sec, idx) => ({ ...sec, sectionNumber: idx + 1 }));
                              setEditedPlan({ ...editedPlan, sections: updatedSecs });
                            }}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition shrink-0"
                            title="Delete Section"
                          >
                            🗑️
                          </button>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Description</label>
                          <textarea
                            value={s.description}
                            onChange={(e) => {
                              const updatedSecs = [...editedPlan.sections!];
                              updatedSecs[i] = { ...s, description: e.target.value };
                              setEditedPlan({ ...editedPlan, sections: updatedSecs });
                            }}
                            className="bg-gray-900 border border-gray-700 rounded-lg text-white text-xs px-3 py-2 outline-none w-full h-16 resize-y"
                            placeholder="Section coverage..."
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Activities</label>
                            <textarea
                              value={s.activities}
                              onChange={(e) => {
                                const updatedSecs = [...editedPlan.sections!];
                                updatedSecs[i] = { ...s, activities: e.target.value };
                                setEditedPlan({ ...editedPlan, sections: updatedSecs });
                              }}
                              className="bg-gray-900 border border-gray-700 rounded-lg text-white text-xs px-3 py-2 outline-none w-full h-16 resize-y"
                              placeholder="Activities..."
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Assessment</label>
                            <textarea
                              value={s.assessment}
                              onChange={(e) => {
                                const updatedSecs = [...editedPlan.sections!];
                                updatedSecs[i] = { ...s, assessment: e.target.value };
                                setEditedPlan({ ...editedPlan, sections: updatedSecs });
                              }}
                              className="bg-gray-900 border border-gray-700 rounded-lg text-white text-xs px-3 py-2 outline-none w-full h-16 resize-y"
                              placeholder="Assessments..."
                            />
                          </div>
                        </div>

                        {/* Section Objectives */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs text-blue-400 font-medium">Objectives</label>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedSecs = [...editedPlan.sections!];
                                const secObjs = [...(s.objectives || [])];
                                secObjs.push("");
                                updatedSecs[i] = { ...s, objectives: secObjs };
                                setEditedPlan({ ...editedPlan, sections: updatedSecs });
                              }}
                              className="text-[10px] bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 px-2 py-0.5 rounded transition"
                            >
                              ➕ Add Objective
                            </button>
                          </div>
                          <div className="space-y-1.5">
                            {s.objectives?.map((obj, j) => (
                              <div key={j} className="flex gap-2 items-center">
                                <span className="text-blue-300 text-xs">•</span>
                                <input
                                  type="text"
                                  value={obj}
                                  onChange={(e) => {
                                    const updatedSecs = [...editedPlan.sections!];
                                    const secObjs = [...s.objectives];
                                    secObjs[j] = e.target.value;
                                    updatedSecs[i] = { ...s, objectives: secObjs };
                                    setEditedPlan({ ...editedPlan, sections: updatedSecs });
                                  }}
                                  className="bg-gray-900 border border-gray-700/80 rounded-lg text-white text-xs px-3 py-1 w-full"
                                  placeholder={`Objective ${j + 1}`}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedSecs = [...editedPlan.sections!];
                                    const secObjs = s.objectives.filter((_, idx) => idx !== j);
                                    updatedSecs[i] = { ...s, objectives: secObjs };
                                    setEditedPlan({ ...editedPlan, sections: updatedSecs });
                                  }}
                                  className="text-red-400 hover:text-red-300 text-xs"
                                >
                                  🗑️
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lessonPlan.sections?.map((s, i) => (
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
                )}
              </Section>
            )}

            {/* LESSON: Structure */}
            {lessonPlan.type === "lesson" && (
              <Section title="📋 Lesson Structure">
                {isEditing && editedPlan ? (
                  <div className="space-y-4">
                    {/* Intro */}
                    <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-white text-sm font-semibold">Introduction</span>
                        <input
                          type="text"
                          value={editedPlan.lessonStructure?.introduction?.duration || ""}
                          onChange={(e) => {
                            const struct = { ...editedPlan.lessonStructure! };
                            struct.introduction = { ...struct.introduction, duration: e.target.value };
                            setEditedPlan({ ...editedPlan, lessonStructure: struct });
                          }}
                          className="bg-gray-900 border border-gray-700 rounded-lg text-white text-xs px-3 py-1 outline-none w-28 focus:border-green-500"
                          placeholder="Duration"
                        />
                      </div>
                      <textarea
                        value={editedPlan.lessonStructure?.introduction?.description || ""}
                        onChange={(e) => {
                          const struct = { ...editedPlan.lessonStructure! };
                          struct.introduction = { ...struct.introduction, description: e.target.value };
                          setEditedPlan({ ...editedPlan, lessonStructure: struct });
                        }}
                        className="bg-gray-900 border border-gray-700 rounded-lg text-white text-sm px-3 py-2 outline-none w-full h-20 focus:border-green-500 resize-y"
                        placeholder="Introduction description..."
                      />
                    </div>
                    {/* Main Activity */}
                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-white text-sm font-semibold">Main Activity</span>
                        <input
                          type="text"
                          value={editedPlan.lessonStructure?.mainActivity?.duration || ""}
                          onChange={(e) => {
                            const struct = { ...editedPlan.lessonStructure! };
                            struct.mainActivity = { ...struct.mainActivity, duration: e.target.value };
                            setEditedPlan({ ...editedPlan, lessonStructure: struct });
                          }}
                          className="bg-gray-900 border border-gray-700 rounded-lg text-white text-xs px-3 py-1 outline-none w-28 focus:border-blue-500"
                          placeholder="Duration"
                        />
                      </div>
                      <textarea
                        value={editedPlan.lessonStructure?.mainActivity?.description || ""}
                        onChange={(e) => {
                          const struct = { ...editedPlan.lessonStructure! };
                          struct.mainActivity = { ...struct.mainActivity, description: e.target.value };
                          setEditedPlan({ ...editedPlan, lessonStructure: struct });
                        }}
                        className="bg-gray-900 border border-gray-700 rounded-lg text-white text-sm px-3 py-2 outline-none w-full h-20 focus:border-blue-500 resize-y"
                        placeholder="Main activity description..."
                      />
                    </div>
                    {/* Wrap Up */}
                    <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-white text-sm font-semibold">Wrap Up</span>
                        <input
                          type="text"
                          value={editedPlan.lessonStructure?.wrapUp?.duration || ""}
                          onChange={(e) => {
                            const struct = { ...editedPlan.lessonStructure! };
                            struct.wrapUp = { ...struct.wrapUp, duration: e.target.value };
                            setEditedPlan({ ...editedPlan, lessonStructure: struct });
                          }}
                          className="bg-gray-900 border border-gray-700 rounded-lg text-white text-xs px-3 py-1 outline-none w-28 focus:border-blue-500"
                          placeholder="Duration"
                        />
                      </div>
                      <textarea
                        value={editedPlan.lessonStructure?.wrapUp?.description || ""}
                        onChange={(e) => {
                          const struct = { ...editedPlan.lessonStructure! };
                          struct.wrapUp = { ...struct.wrapUp, description: e.target.value };
                          setEditedPlan({ ...editedPlan, lessonStructure: struct });
                        }}
                        className="bg-gray-900 border border-gray-700 rounded-lg text-white text-sm px-3 py-2 outline-none w-full h-20 focus:border-blue-500 resize-y"
                        placeholder="Wrap up description..."
                      />
                    </div>
                  </div>
                ) : (
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
                )}
              </Section>
            )}

            {/* LESSON: Assessment */}
            {lessonPlan.type === "lesson" && (
              <Section
                title="📝 Assessment Ideas"
                action={
                  isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        const updatedAss = [...(editedPlan?.assessment || [])];
                        updatedAss.push("");
                        setEditedPlan({ ...editedPlan!, assessment: updatedAss });
                      }}
                      className="text-xs bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 px-3 py-1 rounded-lg transition font-medium"
                    >
                      ➕ Add Assessment Idea
                  </button>
                  )
                }
              >
                {isEditing && editedPlan ? (
                  <div className="space-y-2">
                    {editedPlan.assessment?.map((item, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <span className="text-green-400 font-medium shrink-0">✓</span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const updatedAss = [...editedPlan.assessment!];
                            updatedAss[i] = e.target.value;
                            setEditedPlan({ ...editedPlan, assessment: updatedAss });
                          }}
                          className="bg-gray-800 border border-gray-700/80 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white text-sm outline-none px-4 py-2 w-full transition duration-200"
                          placeholder={`Assessment Idea ${i + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updatedAss = editedPlan.assessment!.filter((_, idx) => idx !== i);
                            setEditedPlan({ ...editedPlan, assessment: updatedAss });
                          }}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-xl transition shrink-0"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                    {editedPlan.assessment?.length === 0 && (
                      <p className="text-gray-500 text-xs italic">No assessment ideas. Click &quot;Add Assessment Idea&quot; to add one.</p>
                    )}
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {lessonPlan.assessment?.map((item, i) => (
                      <li key={i} className="flex gap-2 text-gray-300 text-sm">
                        <span className="text-green-400 mt-0.5">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            )}

            {/* COURSE: Final Assessment */}
            {lessonPlan.type === "course" && (lessonPlan.finalAssessment || isEditing) && (
              <Section title="🏆 Final Assessment">
                {isEditing && editedPlan ? (
                  <textarea
                    value={editedPlan.finalAssessment || ""}
                    onChange={(e) => setEditedPlan({ ...editedPlan, finalAssessment: e.target.value })}
                    className="bg-gray-800 border border-gray-700/80 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white text-sm outline-none px-4 py-2 w-full h-24 resize-y transition duration-200"
                    placeholder="Final course assessment or project..."
                  />
                ) : (
                  <p className="text-gray-300 text-sm">{lessonPlan.finalAssessment}</p>
                )}
              </Section>
            )}

            {/* LESSON: Homework */}
            {lessonPlan.type === "lesson" && (lessonPlan.homework || isEditing) && (
              <Section title="🏠 Homework">
                {isEditing && editedPlan ? (
                  <textarea
                    value={editedPlan.homework || ""}
                    onChange={(e) => setEditedPlan({ ...editedPlan, homework: e.target.value })}
                    className="bg-gray-800 border border-gray-700/80 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white text-sm outline-none px-4 py-2 w-full h-24 resize-y transition duration-200"
                    placeholder="Homework assignment details..."
                  />
                ) : (
                  <p className="text-gray-300 text-sm">{lessonPlan.homework}</p>
                )}
              </Section>
            )}

            {/* Notes */}
            {(lessonPlan.notes || isEditing) && (
              <Section title="📌 Teacher Notes">
                {isEditing && editedPlan ? (
                  <textarea
                    value={editedPlan.notes || ""}
                    onChange={(e) => setEditedPlan({ ...editedPlan, notes: e.target.value })}
                    className="bg-gray-800 border border-gray-700/80 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white text-sm outline-none px-4 py-2 w-full h-24 resize-y transition duration-200"
                    placeholder="Additional notes for teaching..."
                  />
                ) : (
                  <p className="text-gray-300 text-sm">{lessonPlan.notes}</p>
                )}
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