"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import AppHeader from "@/app/components/AppHeader";

type Message = {
    role: "user" | "assistant";
    content: string;
    ready?: boolean;
};

export default function ChatPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <ChatContent />
        </Suspense>
    );
}

function ChatContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionIdFromUrl = searchParams.get("session");

    const [activeSessionId, setActiveSessionId] = useState<string | null>(sessionIdFromUrl);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [ending, setEnding] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const user = session?.user as { subject?: string; gradeLevel?: string } | undefined;
    const subject = user?.subject || "General";
    const gradeLevel = user?.gradeLevel || "";

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated" && session?.user?.role === "admin") {
            router.push("/admin");
        }
    }, [status, session, router]);

    // Load existing session history if resuming
    useEffect(() => {
        if (!activeSessionId || status !== "authenticated") return;
        const loadSession = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/sessions/${activeSessionId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.session && Array.isArray(data.session.messages)) {
                        setMessages(data.session.messages);
                    }
                }
            } catch (err) {
                console.error("Failed to load session:", err);
            } finally {
                setLoading(false);
            }
        };
        loadSession();
    }, [activeSessionId, status]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Welcome message on load for new sessions only
    useEffect(() => {
        if (status === "authenticated" && messages.length === 0 && !activeSessionId) {
            setTimeout(() => {
                setMessages([
                    {
                        role: "assistant",
                        content: `Hi ${session?.user?.name}! 👋 I'm your ${subject} teaching assistant. Tell me what topic or lesson you'd like to plan today, and I'll help you build something great for your ${gradeLevel} students!`,
                    },
                ]);
            }, 0);
        }
    }, [status, messages.length, session?.user?.name, subject, gradeLevel, activeSessionId]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = { role: "user", content: input };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput("");
        setLoading(true);

        let currentSessionId = activeSessionId;

        // 1. If starting a new session, pre-create it in DB on the first user message
        if (!currentSessionId && messages.length === 1) {
            try {
                const title = input.length > 50 ? input.substring(0, 50) + "..." : input;
                const res = await fetch("/api/sessions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title, messages: updatedMessages, subject }),
                });
                if (res.ok) {
                    const data = await res.json();
                    currentSessionId = data.sessionId;
                    setActiveSessionId(currentSessionId);
                    // Silently append ?session=uuid to the browser URL
                    window.history.replaceState(null, "", `/chat?session=${currentSessionId}`);
                }
            } catch (err) {
                console.error("Failed to pre-create session:", err);
            }
        }

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: updatedMessages,
                    subject,
                }),
            });

            const data = await res.json();
            const newAssistantMessage: Message = {
                role: "assistant",
                content: data.message || "Sorry, I couldn't get a response. Please try again.",
                ready: data.ready || false,
            };
            const finalMessages = [...updatedMessages, newAssistantMessage];
            setMessages(finalMessages);

            // 2. Auto-save messages to DB in real-time
            if (currentSessionId) {
                await fetch(`/api/sessions/${currentSessionId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ messages: finalMessages }),
                });
            }
        } catch {
            setMessages([
                ...updatedMessages,
                {
                    role: "assistant",
                    content: "Sorry, something went wrong. Please try again.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const endSession = async () => {
        if (messages.length < 2) return;
        setEnding(true);

        try {
            const firstUserMsg =
                messages.find((m) => m.role === "user")?.content || "Lesson Session";
            const title =
                firstUserMsg.length > 50
                    ? firstUserMsg.substring(0, 50) + "..."
                    : firstUserMsg;

            if (activeSessionId) {
                // Update final state of existing session and redirect
                await fetch(`/api/sessions/${activeSessionId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ messages }),
                });
                router.push(`/lesson-plan/${activeSessionId}`);
            } else {
                // Fallback creation if session ID was not created dynamically
                const res = await fetch("/api/sessions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title, messages, subject }),
                });
                const data = await res.json();

                if (!res.ok) {
                    console.error("Failed to save session:", data);
                    setEnding(false);
                    return;
                }
                router.push(`/lesson-plan/${data.sessionId}`);
            }
        } catch (error) {
            console.error("Failed to end session:", error);
            setEnding(false);
        }
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col">
            {/* Header */}
            <AppHeader mode="chat" />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-3xl mx-auto w-full">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user"
                                ? "bg-blue-600 text-white rounded-br-sm"
                                : "bg-gray-800 text-gray-100 rounded-bl-sm"
                                }`}
                        >
                            {msg.content.split("\n").map((line, j) => (
                                <span key={j}>
                                    {line}
                                    {j < msg.content.split("\n").length - 1 && <br />}
                                </span>
                            ))}
                        </div>

                        {/* Inline generate button — only on the ready message */}
                        {msg.ready && (
                            <button
                                onClick={endSession}
                                disabled={ending}
                                className="mt-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2 cursor-pointer"
                            >
                                {ending ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    "✨ Generate My Plan"
                                )}
                            </button>
                        )}
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0ms]" />
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:150ms]" />
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:300ms]" />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="bg-gray-900 border-t border-gray-800 px-4 py-3 pb-4">
                <div className="max-w-3xl mx-auto flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                        placeholder={`Ask about your ${subject} lesson...`}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={loading || !input.trim()}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer"
                    >
                        Send
                    </button>
                </div>
                <div className="max-w-3xl mx-auto flex items-center justify-between mt-3 text-[10px] text-gray-500 px-1 select-none">
                    <span>© {new Date().getFullYear()} TutorMind. All rights reserved.</span>
                    <span className="font-mono bg-gray-950 border border-gray-800/80 rounded px-1.5 py-0.5">v1.1.4</span>
                </div>
            </div>
        </div>
    );
}