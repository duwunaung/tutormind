"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Message = {
    role: "user" | "assistant";
    content: string;
};

export default function ChatPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [ending, setEnding] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const subject = (session?.user as any)?.subject || "General";
    const gradeLevel = (session?.user as any)?.gradeLevel || "";

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
    }, [status]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Welcome message on load
    useEffect(() => {
        if (status === "authenticated" && messages.length === 0) {
            setMessages([
                {
                    role: "assistant",
                    content: `Hi ${session?.user?.name}! 👋 I'm your ${subject} teaching assistant. Tell me what topic or lesson you'd like to plan today, and I'll help you build something great for your ${gradeLevel} students!`,
                },
            ]);
        }
    }, [status]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = { role: "user", content: input };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput("");
        setLoading(true);

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
            setMessages([
                ...updatedMessages,
                {
                    role: "assistant",
                    content: data.message || "Sorry, I couldn't get a response. Please try again.",
                },
            ]);
        } catch (error) {
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
        if (messages.length < 2) {
            console.log("Not enough messages:", messages.length);
            return;
        }
        setEnding(true);
        console.log("Ending session with messages:", messages);

        try {
            const firstUserMsg =
                messages.find((m) => m.role === "user")?.content || "Lesson Session";
            const title =
                firstUserMsg.length > 50
                    ? firstUserMsg.substring(0, 50) + "..."
                    : firstUserMsg;

            console.log("Sending to API:", { title, messages, subject });

            const res = await fetch("/api/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, messages, subject }),
            });

            console.log("API response status:", res.status);
            const data = await res.json();
            console.log("API response data:", data);

            if (!res.ok) {
                console.error("Failed to save session:", data);
                setEnding(false);
                return;
            }

            router.push(`/lesson-plan/${data.sessionId}`);
        } catch (error) {
            console.error("Failed to end session:", error);
            setEnding(false);
        }
    };
    if (status === "loading") {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <p className="text-gray-400">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col">
            {/* Header */}
            <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-10">                <div>
                <h1 className="text-white font-semibold">TutorMind</h1>
                <p className="text-gray-400 text-xs">
                    {subject} · {gradeLevel}
                </p>
            </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="text-gray-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-gray-800 transition"
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={endSession}
                        disabled={ending || messages.length < 2}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm px-4 py-1.5 rounded-lg transition"
                    >
                        {ending ? "Saving..." : "End Session →"}
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-3xl mx-auto w-full">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
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
            <div className="bg-gray-900 border-t border-gray-800 px-4 py-3">
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
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}