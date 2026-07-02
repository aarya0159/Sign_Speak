"use client";

import { useEffect, useRef, useState } from "react";
import { TutorContext, generateScriptedReply } from "@/lib/scriptedTutor";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const DEFAULT_CONTEXT: TutorContext = {
  streak: 0,
  studiedThisWeek: 0,
  lessonsCompleted: 0,
  missedLetters: [],
};

function readTutorContext(): TutorContext {
  try {
    const stats = JSON.parse(localStorage.getItem("signspeak_stats") || "{}");
    const missedLetters = JSON.parse(localStorage.getItem("signspeak_missed_letters") || "[]");
    return { ...DEFAULT_CONTEXT, ...stats, missedLetters };
  } catch {
    return DEFAULT_CONTEXT;
  }
}

export default function AITutorTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const context = readTutorContext();
    const streakNote = context.streak > 0 ? ` You're on a ${context.streak}-day streak — nice work.` : "";
    const missedNote =
      context.missedLetters.length > 0
        ? ` I saw you've been mixing up ${context.missedLetters.slice(-3).join(", ")} in quizzes — want to drill those?`
        : "";

    setMessages([
      {
        role: "assistant",
        content: `Hi! I'm your AI Tutor.${streakNote}${missedNote} Ask me anything about your ASL learning — what you should study next, how a sign works, or how you're progressing.`,
      },
    ]);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setIsTyping(true);

    const context = readTutorContext();

    // A short delay makes the scripted reply feel like a real chat exchange
    // rather than an instant lookup.
    window.setTimeout(() => {
      const reply = generateScriptedReply(trimmed, context);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setIsTyping(false);
    }, 500);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-full flex-col space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-espresso">AI Tutor</h1>
        <p className="mt-1 text-muted">
          A quick coach for your ASL learning patterns — ask about your progress, what to study
          next, or how a specific sign works.
        </p>
      </div>

      <div className="flex flex-1 flex-col rounded-2xl border border-espresso/10 bg-white/70 p-6 backdrop-blur-md">
        <div ref={scrollRef} className="mb-4 max-h-[26rem] flex-1 space-y-3 overflow-y-auto pr-1">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "bg-purple text-white"
                    : "border border-espresso/10 bg-white text-espresso/90"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-espresso/10 bg-white px-4 py-2 text-sm text-muted">
                AI Tutor is typing...
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your AI Tutor a question..."
            className="w-full rounded-2xl border border-espresso/10 bg-white px-4 py-3 text-sm outline-none focus:border-purple"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isTyping || !input.trim()}
            className="shrink-0 rounded-2xl bg-purple px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
