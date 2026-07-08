"use client";

import { useMemo, useState } from "react";
import HandVisionPanel from "@/components/HandVisionPanel";
import { curriculumData } from "@/lib/curriculumData";
import { AnimFrame, framesForItem, letterFrame } from "@/lib/handShapes";
import { VocabItem } from "@/lib/types";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { CATEGORIES, Category, VOCABULARY, findVocabSign } from "@/lib/vocabulary";

export interface DashboardStats {
  streak: number;
  studiedThisWeek: number;
  timeSpentMinutes: number;
  lessonsCompleted: number;
}

function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="card-warm card-warm-hover p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-peach to-apricot/40 text-lg">
        <span aria-hidden="true">{icon}</span>
      </div>
      <p className="text-2xl font-extrabold text-espresso">{value}</p>
      <p className="text-sm font-medium text-muted">{label}</p>
    </div>
  );
}

interface DashboardTabProps {
  userName: string;
  stats: DashboardStats;
  onContinueLesson: () => void;
  onStartQuiz: () => void;
}

export function DashboardTab({ userName, stats, onContinueLesson, onStartQuiz }: DashboardTabProps) {
  return (
    <div className="animate-fade-up space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Welcome back, <span className="text-sunset">{userName}</span>
        </h1>
        <p className="mt-1 text-muted">Here is how your sign language practice is going.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Current Streak" value={`${stats.streak} days`} icon="🔥" />
        <StatCard label="Studied This Week" value={`${stats.studiedThisWeek} days`} icon="📅" />
        <StatCard label="Time Spent" value={formatMinutes(stats.timeSpentMinutes)} icon="⏱️" />
        <StatCard label="Lessons Completed" value={`${stats.lessonsCompleted}`} icon="✅" />
      </div>

      <div>
        <h2 className="mb-4 text-xl font-bold text-espresso">Jump straight back in</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={onContinueLesson}
            className="group rounded-3xl bg-gradient-to-br from-coral to-honey p-6 text-left text-white shadow-warm transition-all duration-300 hover:-translate-y-1 hover:shadow-warm hover:brightness-105"
          >
            <p className="text-sm font-bold uppercase tracking-wide text-peach">Curriculum</p>
            <p className="mt-2 text-xl font-extrabold">
              Continue Next Lesson <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </p>
            <p className="mt-1 text-sm text-peach/90">
              Pick up right where you left off in the learning pathway.
            </p>
          </button>

          <button
            type="button"
            onClick={onStartQuiz}
            className="group card-warm card-warm-hover p-6 text-left"
          >
            <p className="text-sm font-bold uppercase tracking-wide text-coral">Practice</p>
            <p className="mt-2 text-xl font-extrabold text-espresso">
              Daily Quiz Challenge <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </p>
            <p className="mt-1 text-sm text-muted">
              Test yourself against today&apos;s adaptive vocabulary quiz.
            </p>
          </button>
        </div>
      </div>

      <div className="card-warm p-6">
        <p className="text-sm font-bold uppercase tracking-wide text-coral">Library</p>
        <p className="mt-1 text-espresso">
          <span className="font-extrabold">{VOCABULARY.length} signs</span> across{" "}
          <span className="font-extrabold">{CATEGORIES.length} categories</span> — plus the full
          fingerspelling alphabet — and growing.
        </p>
      </div>
    </div>
  );
}

// ---------- Text → Sign ----------

interface PhraseToken {
  text: string;
  entry: VocabItem | null;
}

/** Greedily matches known multi-word signs (up to 4 words), else falls back per word. */
function tokenizePhrase(input: string): PhraseToken[] {
  const words = input
    .replace(/[?.!,]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  const tokens: PhraseToken[] = [];
  let i = 0;
  while (i < words.length) {
    let matched: PhraseToken | null = null;
    for (let span = Math.min(4, words.length - i); span >= 1; span -= 1) {
      const candidate = words.slice(i, i + span).join(" ");
      const entry = findVocabSign(candidate);
      if (entry) {
        matched = { text: candidate, entry };
        i += span;
        break;
      }
    }
    if (!matched) {
      tokens.push({ text: words[i], entry: null });
      i += 1;
    } else {
      tokens.push(matched);
    }
  }
  return tokens;
}

function framesForTokens(tokens: PhraseToken[]): AnimFrame[] {
  const frames: AnimFrame[] = [];
  for (const token of tokens) {
    if (token.entry) {
      frames.push(...framesForItem(token.entry));
    } else {
      for (const letter of token.text.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 10)) {
        frames.push({ ...letterFrame(letter), label: `${letter} · fingerspell` });
      }
    }
  }
  return frames;
}

const SUGGESTED_PHRASES = ["Hello", "Thank you", "I love you", "Good morning", "Can you help me?", "Water please"];

export function TextToSignTab() {
  const [inputText, setInputText] = useState("Hello");
  const trimmedInput = inputText.trim() || "Hello";

  const tokens = useMemo(() => tokenizePhrase(trimmedInput), [trimmedInput]);
  const frames = useMemo(() => framesForTokens(tokens), [tokens]);
  const knownEntries = tokens.filter((token) => token.entry !== null);

  const { isSupported, isListening, toggleListening } = useSpeechRecognition((transcript) => {
    setInputText(transcript);
  });

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Text <span className="text-sunset">→</span> Sign
        </h1>
        <p className="mt-1 text-muted">
          Type or speak a sentence — real ASL signs are used for known words, and names are fingerspelled.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card-warm space-y-4 p-6">
          <label className="block text-sm font-bold text-espresso/80">Type or speak text input</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              placeholder="Try a sentence like 'thank you friend'..."
              className="w-full rounded-full border border-espresso/10 bg-white px-5 py-3 text-sm outline-none focus:border-coral focus:shadow-warm-sm"
            />
            {isSupported && (
              <button
                type="button"
                onClick={toggleListening}
                aria-pressed={isListening}
                title={isListening ? "Mute microphone" : "Resume listening"}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-lg ${
                  isListening
                    ? "border-rose/40 bg-rose/10 text-rose animate-pulse"
                    : "border-espresso/10 bg-white text-coral hover:bg-peach"
                }`}
              >
                <span aria-hidden="true">{isListening ? "⏹" : "🎙️"}</span>
              </button>
            )}
          </div>
          {isListening && (
            <p className="flex items-center gap-2 text-xs font-bold text-rose">
              <span className="h-1.5 w-1.5 rounded-full bg-rose" />
              Listening...
            </p>
          )}
          {!isSupported && (
            <p className="text-xs text-muted">
              Voice input isn&apos;t supported in this browser. Try Chrome, Edge, or Safari.
            </p>
          )}

          <div>
            <p className="mb-2 text-sm font-bold text-espresso/80">Sign-by-sign breakdown</p>
            <div className="flex flex-wrap gap-2">
              {tokens.map((token, index) => (
                <span
                  key={`${token.text}-${index}`}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    token.entry
                      ? "bg-gradient-to-r from-peach to-apricot/50 text-coral-deep"
                      : "border border-dashed border-espresso/25 text-muted"
                  }`}
                >
                  {token.entry ? token.entry.word : `${token.text} · fingerspell`}
                </span>
              ))}
            </div>
          </div>

          {knownEntries.length > 0 && (
            <div className="space-y-2">
              {knownEntries.slice(0, 3).map((token) => (
                <div key={token.entry!.word} className="rounded-2xl bg-white/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-coral">
                    {token.entry!.word} · {token.entry!.type}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-espresso/90">
                    {token.entry!.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-muted">
            Try:{" "}
            {SUGGESTED_PHRASES.map((suggestion, i) => (
              <span key={suggestion}>
                <button
                  type="button"
                  onClick={() => setInputText(suggestion)}
                  className="font-bold text-coral hover:underline"
                >
                  {suggestion}
                </button>
                {i < SUGGESTED_PHRASES.length - 1 ? " · " : ""}
              </span>
            ))}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-bold text-espresso/80">
            Animated sign playback · {frames.length} step{frames.length === 1 ? "" : "s"}
          </p>
          <HandVisionPanel
            label={trimmedInput}
            frames={frames}
            visualCue={`${knownEntries.length} known sign${knownEntries.length === 1 ? "" : "s"} · ${
              tokens.length - knownEntries.length
            } fingerspelled`}
          />
        </div>
      </div>
    </div>
  );
}

// ---------- Dictionary ----------

function useAllVocab(): VocabItem[] {
  return useMemo(() => {
    const seen = new Set<string>();
    const all: VocabItem[] = [];
    Object.values(curriculumData).forEach((modules) => {
      modules.forEach((module) => {
        module.items.forEach((item) => {
          if (!seen.has(item.word)) {
            seen.add(item.word);
            all.push(item);
          }
        });
      });
    });
    return all;
  }, []);
}

interface DictionaryTabProps {
  onStartQuiz: () => void;
}

export function DictionaryTab({ onStartQuiz }: DictionaryTabProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "All" | "Letter">("All");
  const allVocab = useAllVocab();
  const [selected, setSelected] = useState<VocabItem | null>(null);

  const results = useMemo(() => {
    let pool = allVocab;
    if (category !== "All") pool = pool.filter((item) => item.type === category);
    const lowered = query.trim().toLowerCase();
    if (lowered) pool = pool.filter((item) => item.word.toLowerCase().includes(lowered));
    return pool;
  }, [query, category, allVocab]);

  const filterOptions: Array<Category | "All" | "Letter"> = ["All", "Letter", ...CATEGORIES];

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Dictionary <span className="text-sunset">&amp;</span> Quizzes
        </h1>
        <p className="mt-1 text-muted">
          {allVocab.length} signs and letters — search, browse by topic, and preview each one.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card-warm space-y-4 p-6 lg:col-span-2">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search all signs..."
            className="w-full rounded-full border border-espresso/10 bg-white px-5 py-3 text-sm outline-none focus:border-coral focus:shadow-warm-sm"
          />

          <div className="flex flex-wrap gap-1.5">
            {filterOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCategory(option)}
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  category === option
                    ? "bg-gradient-to-r from-coral to-honey text-white shadow-warm-sm"
                    : "bg-white/70 text-muted hover:bg-peach hover:text-coral-deep"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <ul className="max-h-[24rem] space-y-2 overflow-y-auto pr-1">
            {results.map((item) => (
              <li key={item.word}>
                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
                    selected?.word === item.word
                      ? "border-coral/40 bg-peach/60"
                      : "border-espresso/10 bg-white hover:border-coral/30 hover:bg-peach/30"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-extrabold text-espresso">{item.word}</p>
                    <p className="truncate text-sm text-muted">{item.description}</p>
                  </div>
                  <span className="chip-warm shrink-0">{item.type}</span>
                </button>
              </li>
            ))}
            {results.length === 0 && (
              <li className="rounded-2xl border border-dashed border-espresso/20 px-4 py-6 text-center text-sm text-muted">
                No signs found{query ? ` for "${query}"` : ""}.
              </li>
            )}
          </ul>
        </div>

        <div className="space-y-4">
          {selected ? (
            <div className="space-y-3">
              <HandVisionPanel
                label={selected.word}
                frames={framesForItem(selected)}
                visualCue={selected.visualCue}
              />
              <div className="card-warm p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-coral">{selected.type}</p>
                <p className="mt-1 text-sm leading-relaxed text-espresso/90">{selected.description}</p>
              </div>
            </div>
          ) : (
            <div className="card-warm p-5">
              <p className="text-sm font-bold uppercase tracking-wide text-coral">Preview</p>
              <p className="mt-2 text-sm text-muted">
                Tap any sign in the list to watch its animated handshape and read how it&apos;s made.
              </p>
            </div>
          )}

          <div className="card-warm card-warm-hover p-5">
            <p className="text-sm font-bold uppercase tracking-wide text-coral">Quizzes</p>
            <p className="mt-2 font-extrabold text-espresso">Adaptive practice</p>
            <p className="mt-1 text-sm text-muted">
              Quiz difficulty adjusts automatically based on your recent accuracy.
            </p>
            <button
              type="button"
              onClick={onStartQuiz}
              className="btn-sunset mt-4 w-full py-2.5 text-sm"
            >
              Start Daily Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
