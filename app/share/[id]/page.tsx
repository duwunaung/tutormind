"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import AppFooter from "@/app/components/AppFooter";

type LessonPlan = {
  title: string;
  subject: string;
  gradeLevel: string;
  worksheet: string;
};

export default function SharePage() {
  const { id } = useParams();
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"handout" | "worksheet" | "homework">("handout");
  const [copyStatus, setCopyStatus] = useState<"none" | "handout" | "worksheet" | "homework">("none");
  const hasFetched = useRef(false);

  const parseWorksheetContent = (text: string) => {
    if (!text) return { worksheet: "", homework: "", full: "" };

    const content = text.replace(/\r\n/g, "\n");
    const homeworkMarker = "# Student Homework:";

    let worksheet = "";
    let homework = "";

    const homeworkIdx = content.indexOf(homeworkMarker);

    if (homeworkIdx !== -1) {
      worksheet = content.slice(0, homeworkIdx).trim();
      homework = content.slice(homeworkIdx).trim();
    } else {
      worksheet = content.trim();
    }

    const cleanSection = (sec: string) => {
      return sec.replace(/\n\s*---\s*$/, "").trim();
    };

    return {
      worksheet: cleanSection(worksheet),
      homework: cleanSection(homework),
      full: content.trim(),
    };
  };

  const handleCopyText = (type: "handout" | "worksheet" | "homework") => {
    const rawWorksheet = lessonPlan?.worksheet || "";
    if (!rawWorksheet) return;

    const parsed = parseWorksheetContent(rawWorksheet);
    let textToCopy = "";

    if (type === "handout") {
      textToCopy = `${parsed.worksheet}\n\n${parsed.homework}`.trim();
    } else if (type === "worksheet") {
      textToCopy = parsed.worksheet;
    } else {
      textToCopy = parsed.homework;
    }

    navigator.clipboard.writeText(textToCopy);
    setCopyStatus(type);
    setTimeout(() => setCopyStatus("none"), 2000);
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchPlan = async () => {
      try {
        const res = await fetch(`/api/share/${id}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load worksheet");
          return;
        }

        setLessonPlan(data.lessonPlan);
      } catch (err) {
        console.error("Public share page load error:", err);
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm font-medium">Loading worksheet...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-sm text-center shadow-xl">
          <p className="text-4xl mb-4 select-none">🔒</p>
          <h2 className="text-white text-lg font-bold">Access Restrained</h2>
          <p className="text-gray-400 text-xs mt-2 leading-relaxed">
            {error === "This plan is private"
              ? "This document is private or sharing has been disabled by the instructor."
              : "We couldn't locate the worksheet you were looking for. Please check the URL and try again."}
          </p>
        </div>
      </div>
    );
  }

  if (!lessonPlan) return null;

  const parsedWorksheet = parseWorksheetContent(lessonPlan.worksheet);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Global CSS style block for printing */}
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
          
          /* Only display the active container and its descendants */
          #printable-worksheet, 
          #printable-worksheet * {
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
            visibility: hidden !important;
          }
          
          .page-break {
            page-break-before: always !important;
            break-before: page !important;
          }
        }
      `}} />

      {/* Simplified Student Branding Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 sticky top-0 z-20 no-print">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/apple-icon.png"
              alt="TutorMind Logo"
              className="w-8 h-8 rounded-lg object-contain shadow-md shadow-blue-500/10"
            />
            <h1 className="text-white font-bold text-sm sm:text-base tracking-tight leading-tight">TutorMind</h1>
          </div>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Student Handout Portal</span>
        </div>
      </div>

      <div className="max-w-3xl w-full mx-auto px-4 py-6 sm:py-8 flex-1 flex flex-col justify-start">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden p-6">
          
          {/* Sub-tabs header for Student views */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-3 no-print select-none mb-6">
            <div className="flex flex-wrap gap-1 bg-gray-950/45 p-1 rounded-xl border border-gray-800/80">
              <button
                onClick={() => setActiveTab("handout")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeTab === "handout"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                📄 Student Handout
              </button>
              <button
                onClick={() => setActiveTab("worksheet")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeTab === "worksheet"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                📖 Worksheet Only
              </button>
              {parsedWorksheet.homework && (
                <button
                  onClick={() => setActiveTab("homework")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    activeTab === "homework"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  🏠 Homework Only
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyText(activeTab)}
                className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-xs px-3.5 py-2 rounded-xl transition font-semibold cursor-pointer flex items-center gap-1.5"
              >
                📋 {copyStatus === activeTab ? "Copied! ✓" : "Copy Current"}
              </button>
              <button
                onClick={() => window.print()}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-xl font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-blue-600/10"
              >
                🖨️ Print / Save PDF
              </button>
            </div>
          </div>

          {/* A4 Paper mockup container */}
          <div
            id="printable-worksheet"
            className="bg-white text-gray-900 border border-gray-200/80 shadow-2xl p-8 md:p-14 max-w-[850px] mx-auto rounded-2xl min-h-[1100px] relative font-sans select-text"
          >
            {/* Header Banner */}
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

            {/* Student Metadata Box */}
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

            {/* Content rendering using MarkdownRenderer */}
            <div className="prose prose-slate max-w-none">
              {activeTab === "handout" && (
                <div className="space-y-12">
                  <div>
                    <MarkdownRenderer content={parsedWorksheet.worksheet} />
                  </div>
                  {parsedWorksheet.homework && (
                    <>
                      <div className="border-t border-dashed border-gray-300 pt-8 mt-8 page-break no-print" />
                      <div className="page-break" />
                      <div>
                        <MarkdownRenderer content={parsedWorksheet.homework} />
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === "worksheet" && (
                <MarkdownRenderer content={parsedWorksheet.worksheet} />
              )}

              {activeTab === "homework" && (
                <MarkdownRenderer content={parsedWorksheet.homework} />
              )}
            </div>
          </div>

        </div>
      </div>

      <AppFooter />
    </div>
  );
}

// Custom Markdown-to-HTML Renderer
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
        codeBlockLines = [];
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
