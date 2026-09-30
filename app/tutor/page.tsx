"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { TabKey } from "@/lib/types";
import { getDashboardStats, recordActivity } from "@/lib/stats";
import { useSessionTimer } from "@/lib/useSessionTimer";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface StoredContext {
  streak: number;
  studiedThisWeek: number;
  lessonsCompleted: number;
  missedLetters: string[];
}

function readStoredContext(): StoredContext {
  const stats = getDashboardStats();
  let missedLetters: string[] = [];
  try {
    missedLetters = JSON.parse(localStorage.getItem("signspeak_missed_letters") || "[]");
  } catch {
    missedLetters = [];
  }
  return {
    streak: stats.streak,
    studiedThisWeek: stats.studiedThisWeek,
    lessonsCompleted: stats.lessonsCompleted,
    missedLetters,
  };
}

const SUGGESTED_QUESTIONS = [
  "How do I sign THANK-YOU correctly?",
  "What should I study next?",
  "Why do facial expressions matter in ASL?",
];

export default function TutorPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useSessionTimer();

  useEffect(() => {
    recordActivity();
    const context = readStoredContext();
    const streakNote = context.streak > 0 ? ` You're on a ${context.streak}-day streak — love to see it.` : "";
    const missedNote =
      context.missedLetters.length > 0
        ? ` I noticed ${context.missedLetters.slice(-3).join(", ")} tripped you up in quizzes recently — happy to break those down.`
        : "";

    setMessages([
      {
        role: "assistant",
        content: `Hi, I'm your SignSpeak Coach! 🤟${streakNote}${missedNote} Ask me anything about ASL — handshapes, facial expressions, Deaf culture, or what to practice next.`,
      },
    ]);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isPending]);

  function handleSidebarNavigate(tab: TabKey) {
    if (tab === "ai-tutor") return;
    if (tab === "lessons") {
      router.push("/lessons");
      return;
    }
    router.push(`/home?tab=${tab}`);
  }

  function handleLogout() {
    localStorage.removeItem("signspeak_user_name");
    localStorage.removeItem("signspeak_user_email");
    router.push("/login");
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setIsPending(true);

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, context: readStoredContext() }),
      });
      const data = await response.json();

      if (!response.ok || !data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Hmm, something went wrong on my end. Give it another try in a moment?",
          },
        ]);
        return;
      }

      setIsOffline(data.source === "offline");
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I couldn't reach the server — check your connection and try again.",
        },
      ]);
    } finally {
      setIsPending(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar activeTab="ai-tutor" onNavigate={handleSidebarNavigate} onLogout={handleLogout} />

      <main className="flex min-h-0 flex-1 flex-col px-6 py-8 pb-24 sm:px-10 md:pb-8">
        <div className="animate-fade-up mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            AI <span className="text-sunset">Tutor</span>
          </h1>
          <p className="mt-1 text-muted">
            Your personal ASL coach.
            {isOffline && (
              <span className="ml-2 chip-warm">offline coach mode</span>
            )}
          </p>
        </div>

        <div className="card-warm animate-fade-up flex min-h-0 flex-1 flex-col p-6">
          <div ref={scrollRef} className="mb-4 flex-1 space-y-4 overflow-y-auto pr-1">
            {messages.map((message, index) =>
              message.role === "assistant" ? (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-coral to-honey text-base shadow-warm-sm">
                    <span aria-hidden="true">🤟</span>
                  </div>
                  <div className="max-w-[75%]">
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-coral">
                      SignSpeak Coach ✨
                    </p>
                    <div className="rounded-2xl rounded-tl-sm border border-espresso/10 bg-white px-4 py-3 text-sm leading-relaxed text-espresso/90 whitespace-pre-wrap">
                      {message.content}
                    </div>
                  </div>
                </div>
              ) : (
                <div key={index} className="flex justify-end">
                  <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-coral to-coral-deep px-4 py-3 text-sm leading-relaxed text-white shadow-warm-sm">
                    {message.content}
                  </div>
                </div>
              ),
            )}

            {isPending && (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-coral to-honey text-base shadow-warm-sm">
                  <span aria-hidden="true">🤟</span>
                </div>
                <div className="rounded-2xl rounded-tl-sm border border-espresso/10 bg-white px-4 py-3">
                  <span className="typing-dots inline-flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-apricot" />
                    <span className="h-2 w-2 rounded-full bg-apricot" />
                    <span className="h-2 w-2 rounded-full bg-apricot" />
                  </span>
                </div>
              </div>
            )}
          </div>

          {messages.length <= 1 && !isPending && (
            <div className="mb-3 flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => sendMessage(question)}
                  className="rounded-full border border-coral/25 bg-peach/50 px-3 py-1.5 text-xs font-bold text-coral-deep hover:bg-peach"
                >
                  {question}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isPending}
              placeholder="Ask your coach anything about ASL..."
              className="w-full rounded-full border border-espresso/10 bg-white px-5 py-3 text-sm outline-none focus:border-coral focus:shadow-warm-sm disabled:bg-espresso/5"
            />
            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={isPending || !input.trim()}
              className="btn-sunset shrink-0 px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isPending ? "..." : "Send"}
            </button>
          </div>
        </div>
      </main>

      <style jsx>{`
        .typing-dots span {
          animation: bounce 1.2s ease-in-out infinite;
        }
        .typing-dots span:nth-child(2) {
          animation-delay: 0.15s;
        }
        .typing-dots span:nth-child(3) {
          animation-delay: 0.3s;
        }
        @keyframes bounce {
          0%,
          60%,
          100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          30% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
