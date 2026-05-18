"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

type LessonPlan = {
    title: string;
    subject: string;
    gradeLevel: string;
    duration: string;
    objectives: string[];
    materials: string[];
    lessonStructure: {
        introduction: { duration: string; description: string };
        mainActivity: { duration: string; description: string };
        wrapUp: { duration: string; description: string };
    };
    assessment: string[];
    homework: string;
    notes: string;
};

export default function LessonPlanPage() {
    const { sessionId } = useParams();
    const router = useRouter();
    const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const hasFetched = useRef(false); // ✅ Prevent double fetch

    useEffect(() => {
        if (hasFetched.current) return; // ✅ Stop second call
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
            } catch (err) {
                console.error("Lesson plan fetch error:", err);
                setError("Something went wrong");
            } finally {
                setLoading(false);
            }
        };

        generate();
    }, [sessionId]);

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
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition"
                    >
                        ← Dashboard
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={() => router.push("/chat")}
                            className="bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg transition"
                        >
                            + New Session
                        </button>
                        <button
                            disabled
                            className="bg-blue-600 opacity-50 text-white text-sm px-4 py-2 rounded-lg cursor-not-allowed"
                        >
                            Download (Coming Soon)
                        </button>
                    </div>
                </div>

                {/* Lesson Plan Card */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">

                    {/* Title Block */}
                    <div className="bg-blue-600 px-6 py-5">
                        <h1 className="text-xl font-bold text-white">{lessonPlan.title}</h1>
                        <div className="flex gap-4 mt-2 text-blue-100 text-sm">
                            <span>📚 {lessonPlan.subject}</span>
                            <span>🎓 {lessonPlan.gradeLevel}</span>
                            <span>⏱ {lessonPlan.duration}</span>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">

                        {/* Learning Objectives */}
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

                        {/* Lesson Structure */}
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

                        {/* Assessment */}
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

                        {/* Homework */}
                        <Section title="🏠 Homework">
                            <p className="text-gray-300 text-sm">{lessonPlan.homework}</p>
                        </Section>

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