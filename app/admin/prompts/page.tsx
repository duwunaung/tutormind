"use client";

import { useEffect, useState } from "react";
import AdminHeader from "@/app/components/AdminHeader";

type PromptTemplate = {
  id: string;
  subject: string;
  template: string;
  temperature: number;
  updatedAt: string;
};

export default function PromptsAdminPage() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Edit fields
  const [editText, setEditText] = useState("");
  const [editTemperature, setEditTemperature] = useState(0.7);

  const selectTemplate = (tpl: PromptTemplate) => {
    setSelectedTemplate(tpl);
    setEditText(tpl.template);
    setEditTemperature(tpl.temperature);
    setMessage(null);
  };

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/prompts");
        const data = await res.json();
        if (res.ok && data.templates) {
          setTemplates(data.templates);
          if (data.templates.length > 0) {
            const firstTpl = data.templates[0];
            setSelectedTemplate(firstTpl);
            setEditText(firstTpl.template);
            setEditTemperature(firstTpl.temperature);
          }
        } else {
          setMessage({ text: data.error || "Failed to load templates from database.", type: "error" });
        }
      } catch (err) {
        console.error("Failed to load templates:", err);
        setMessage({ text: "Failed to load templates from database.", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleSave = async () => {
    if (!selectedTemplate) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/prompts/${selectedTemplate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: editText,
          temperature: editTemperature,
        }),
      });

      const data = await res.json();
      if (res.ok && data.template) {
        setMessage({ text: "Template updated successfully!", type: "success" });
        // Update local list
        setTemplates((prev) =>
          prev.map((t) => (t.id === selectedTemplate.id ? data.template : t))
        );
        setSelectedTemplate(data.template);
      } else {
        setMessage({ text: data.error || "Failed to update template.", type: "error" });
      }
    } catch (err) {
      console.error("Save error:", err);
      setMessage({ text: "An error occurred while saving.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col">
        <AdminHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AdminHeader />

      <div className="max-w-6xl w-full mx-auto px-6 py-8 flex-1 flex flex-col md:flex-row gap-6">
        {/* Left pane: Subjects List */}
        <div className="w-full md:w-64 bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-2 h-fit shrink-0">
          <h2 className="text-sm font-semibold text-gray-400 mb-2 px-2">Subjects</h2>
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => selectTemplate(tpl)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition flex flex-col gap-1 ${
                selectedTemplate?.id === tpl.id
                  ? "bg-blue-600 text-white font-medium"
                  : "bg-transparent text-gray-300 hover:bg-gray-800/60"
              }`}
            >
              <span>{tpl.subject}</span>
              <span
                className={`text-[10px] ${
                  selectedTemplate?.id === tpl.id ? "text-blue-200" : "text-gray-500"
                }`}
              >
                Temp: {tpl.temperature.toFixed(1)}
              </span>
            </button>
          ))}
        </div>

        {/* Right pane: Prompt Editor */}
        <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-6">
          {selectedTemplate ? (
            <>
              {/* Header */}
              <div className="border-b border-gray-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedTemplate.subject} Prompt</h2>
                  <p className="text-gray-500 text-xs mt-1">
                    Configure the instructions and creativity index (temperature) for this tutor subject.
                  </p>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>

              {/* Alerts */}
              {message && (
                <div
                  className={`px-4 py-3 rounded-lg text-sm border ${
                    message.type === "success"
                      ? "bg-green-500/10 border-green-500/20 text-green-400"
                      : "bg-red-500/10 border-red-500/20 text-red-400"
                  }`}
                >
                  {message.text}
                </div>
              )}

              {/* Temperature Config */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-300">
                    Model Temperature (Creativity)
                  </label>
                  <span className="text-blue-400 font-mono text-sm font-bold bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                    {editTemperature.toFixed(1)}
                  </span>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">
                  Lower values (0.0 - 0.5) make output focused and deterministic. Higher values (0.8 - 1.5) increase random creativity. Default is 0.7.
                </p>
                <input
                  type="range"
                  min="0.0"
                  max="1.5"
                  step="0.1"
                  value={editTemperature}
                  onChange={(e) => setEditTemperature(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
                />
              </div>

              {/* Instructions Editor */}
              <div className="flex-1 flex flex-col gap-2 min-h-[300px]">
                <label className="text-sm font-semibold text-gray-300">
                  Base System Prompt Template
                </label>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="Enter system prompt instructions..."
                  className="flex-1 w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-sm font-mono text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[350px] leading-relaxed"
                />
                <div className="flex justify-between items-center text-xs text-gray-500 px-1">
                  <span>Characters: {editText.length}</span>
                  <span className="text-amber-500/80">
                    ⚠️ The dynamic instructions block (`[READY_TO_GENERATE]` validation) will be automatically appended.
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              No template selected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


