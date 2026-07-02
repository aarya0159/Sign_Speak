"use client";

import { useMemo, useState } from "react";
import HandVisionPanel from "@/components/HandVisionPanel";
import { curriculumData } from "@/lib/curriculumData";
import { VocabItem } from "@/lib/types";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { WORD_SIGNS, findWordSign } from "@/lib/wordSigns";

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
    <div className="rounded-2xl border border-espresso/10 bg-white/70 p-5 backdrop-blur-md">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-purple-soft text-lg">
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-espresso">
          Welcome back, {userName}
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
            className="rounded-2xl border border-espresso/10 bg-purple p-6 text-left text-white shadow-sm transition hover:opacity-90"
          >
            <p className="text-sm font-bold uppercase tracking-wide text-purple-soft">Curriculum</p>
            <p className="mt-2 text-xl font-extrabold">Continue Next Lesson →</p>
            <p className="mt-1 text-sm text-purple-soft/90">
              Pick up right where you left off in the learning pathway.
            </p>
          </button>

          <button
            type="button"
            onClick={onStartQuiz}
            className="rounded-2xl border border-espresso/10 bg-white/70 p-6 text-left backdrop-blur-md transition hover:bg-purple-soft/40"
          >
            <p className="text-sm font-bold uppercase tracking-wide text-purple">Practice</p>
            <p className="mt-2 text-xl font-extrabold text-espresso">Daily Quiz Challenge →</p>
            <p className="mt-1 text-sm text-muted">
              Test yourself against today&apos;s adaptive vocabulary quiz.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

export function TextToSignTab() {
  const [inputText, setInputText] = useState("Hello");
  const trimmedInput = inputText.trim();
  const activeWord = trimmedInput.length > 0 ? trimmedInput.toUpperCase() : "HELLO";
  const wholeWordSign = findWordSign(trimmedInput || "HELLO");

  const breakdown = useMemo(
    () => activeWord.replace(/[^A-Z]/g, "").split("").slice(0, 12),
    [activeWord],
  );

  const { isSupported, isListening, toggleListening } = useSpeechRecognition((transcript) => {
    setInputText(transcript);
  });

  const knownWords = Object.values(WORD_SIGNS).map((item) => item.word);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-espresso">Text → Sign</h1>
        <p className="mt-1 text-muted">
          Your microphone listens automatically — just say a word and watch it convert to sign.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-espresso/10 bg-white/70 p-6 backdrop-blur-md">
          <label className="block text-sm font-bold text-espresso/80">Type or speak text input</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              placeholder="Type a word to translate..."
              className="w-full rounded-2xl border border-espresso/10 bg-white px-4 py-3 text-sm outline-none focus:border-purple"
            />
            {isSupported && (
              <button
                type="button"
                onClick={toggleListening}
                aria-pressed={isListening}
                title={isListening ? "Mute microphone" : "Resume listening"}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-lg transition ${
                  isListening
                    ? "border-red-300 bg-red-50 text-red-600 animate-pulse"
                    : "border-espresso/10 bg-white text-purple hover:bg-purple-soft"
                }`}
              >
                <span aria-hidden="true">{isListening ? "⏹" : "🎙️"}</span>
              </button>
            )}
          </div>
          {isListening && (
            <p className="flex items-center gap-2 text-xs font-bold text-red-600">
              <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
              Listening...
            </p>
          )}
          {!isSupported && (
            <p className="text-xs text-muted">
              Voice input isn&apos;t supported in this browser. Try Chrome, Edge, or Safari.
            </p>
          )}

          {wholeWordSign ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-green-700">
                Recognized whole-word sign
              </p>
              <p className="mt-1 text-sm text-green-900">
                ASL signs &quot;{wholeWordSign.word}&quot; as a single dedicated sign, not letter by
                letter. Here&apos;s how it&apos;s made:
              </p>
              <p className="mt-2 text-sm leading-relaxed text-espresso/90">
                {wholeWordSign.description}
              </p>
            </div>
          ) : (
            <div>
              <p className="mb-2 text-sm font-bold text-espresso/80">
                No dedicated sign yet — fingerspelling &quot;{activeWord}&quot;
              </p>
              <ul className="space-y-2">
                {breakdown.map((letter, index) => (
                  <li
                    key={`${letter}-${index}`}
                    className="flex items-center gap-3 rounded-xl border border-espresso/10 bg-white px-3 py-2 text-sm"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-soft text-xs font-extrabold text-purple">
                      {index + 1}
                    </span>
                    <span className="font-bold text-espresso">{letter}</span>
                    <span className="text-muted">Fingerspell handshape for &quot;{letter}&quot;</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted">
                Try a word with a dedicated sign:{" "}
                {knownWords.map((word, i) => (
                  <span key={word}>
                    <button
                      type="button"
                      onClick={() => setInputText(word)}
                      className="font-bold text-purple hover:underline"
                    >
                      {word}
                    </button>
                    {i < knownWords.length - 1 ? " · " : ""}
                  </span>
                ))}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-bold text-espresso/80">
            {wholeWordSign ? "Whole-word sign · ASL dictionary" : "Fingerspelled avatar · animated demo"}
          </p>
          <HandVisionPanel
            word={wholeWordSign ? wholeWordSign.word : activeWord}
            description={wholeWordSign?.description}
            visualCue={
              wholeWordSign
                ? wholeWordSign.visualCue
                : `Rendering fingerspelled avatar for "${activeWord}"`
            }
            index={0}
            total={1}
          />
        </div>
      </div>
    </div>
  );
}

function useVocabIndex() {
  return useMemo(() => {
    const all: VocabItem[] = [];
    Object.values(curriculumData).forEach((modules) => {
      modules.forEach((module) => all.push(...module.items));
    });
    return all;
  }, []);
}

interface DictionaryTabProps {
  onStartQuiz: () => void;
}

export function DictionaryTab({ onStartQuiz }: DictionaryTabProps) {
  const [query, setQuery] = useState("");
  const allVocab = useVocabIndex();

  const results = useMemo(() => {
    if (!query.trim()) return allVocab.slice(0, 6);
    const lowered = query.trim().toLowerCase();
    return allVocab.filter((item) => item.word.toLowerCase().includes(lowered));
  }, [query, allVocab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-espresso">Dictionary & Quizzes</h1>
        <p className="mt-1 text-muted">Search all signs, then put your knowledge to the test.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 rounded-2xl border border-espresso/10 bg-white/70 p-6 backdrop-blur-md">
          <label className="block text-sm font-bold text-espresso/80">Search all signs</label>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the dictionary..."
            className="w-full rounded-2xl border border-espresso/10 bg-white px-4 py-3 text-sm outline-none focus:border-purple"
          />

          <ul className="space-y-2">
            {results.map((item) => (
              <li
                key={item.word}
                className="flex items-center justify-between rounded-xl border border-espresso/10 bg-white px-4 py-3"
              >
                <div>
                  <p className="font-extrabold text-espresso">{item.word}</p>
                  <p className="text-sm text-muted">{item.description}</p>
                </div>
                <span className="rounded-full bg-purple-soft px-3 py-1 text-xs font-bold text-purple">
                  {item.type}
                </span>
              </li>
            ))}
            {results.length === 0 && (
              <li className="rounded-xl border border-dashed border-espresso/20 px-4 py-6 text-center text-sm text-muted">
                No signs found for &quot;{query}&quot;.
              </li>
            )}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-espresso/10 bg-white/70 p-5 backdrop-blur-md">
            <p className="text-sm font-bold uppercase tracking-wide text-purple">Quizzes</p>
            <p className="mt-2 font-extrabold text-espresso">Adaptive practice</p>
            <p className="mt-1 text-sm text-muted">
              Quiz difficulty adjusts automatically based on your recent accuracy.
            </p>
            <button
              type="button"
              onClick={onStartQuiz}
              className="mt-4 w-full rounded-2xl bg-purple py-2 text-sm font-bold text-white transition hover:opacity-90"
            >
              Start Daily Quiz
            </button>
          </div>

          <div className="rounded-2xl border border-espresso/10 bg-white/70 p-5 backdrop-blur-md">
            <p className="text-sm font-bold uppercase tracking-wide text-purple">Daily Challenge</p>
            <p className="mt-2 font-extrabold text-espresso">Keep your streak alive</p>
            <p className="mt-1 text-sm text-muted">Complete one quiz today to earn bonus XP.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
