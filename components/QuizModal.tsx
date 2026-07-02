"use client";

import { useState } from "react";
import HandVisionPanel from "@/components/HandVisionPanel";
import { curriculumData } from "@/lib/curriculumData";
import { VocabItem } from "@/lib/types";

const QUIZ_LENGTH = 8;

interface QuizModalProps {
  onClose: () => void;
  onFinish?: (score: { correct: number; total: number }) => void;
}

function shuffledQuizItems(): VocabItem[] {
  const alphabet = curriculumData.beginner.find((module) => module.id === "alphabet")!.items;
  const shuffled = [...alphabet];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, QUIZ_LENGTH);
}

export default function QuizModal({ onClose, onFinish }: QuizModalProps) {
  const [quizItems] = useState<VocabItem[]>(shuffledQuizItems);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isComplete, setIsComplete] = useState(false);

  const total = quizItems.length;
  const currentItem = quizItems[currentIndex];
  const progressPercent = ((currentIndex + (isRevealed ? 1 : 0)) / total) * 100;

  function revealAnswer() {
    setIsRevealed(true);
  }

  function scoreAndAdvance(gotItRight: boolean) {
    const nextScore = { correct: score.correct + (gotItRight ? 1 : 0), total: score.total + 1 };
    setScore(nextScore);

    if (currentIndex === total - 1) {
      setIsComplete(true);
      onFinish?.(nextScore);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setUserAnswer("");
    setIsRevealed(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/40 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-3xl border border-espresso/10 bg-cream p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-muted">Daily Quiz · Manual Alphabet</p>
            {!isComplete && (
              <p className="text-xs text-muted">
                Question {currentIndex + 1} of {total}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-espresso/10 bg-white/70 px-3 py-1 text-sm font-bold text-espresso/70 transition hover:bg-white"
          >
            Close
          </button>
        </div>

        <div className="mb-8 h-2 w-full overflow-hidden rounded-full bg-espresso/10">
          <div
            className="h-full rounded-full bg-purple transition-all duration-300"
            style={{ width: `${isComplete ? 100 : progressPercent}%` }}
          />
        </div>

        {isComplete ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
            <p className="text-sm font-bold uppercase tracking-wide text-purple">Quiz complete</p>
            <p className="text-4xl font-extrabold text-espresso">
              {score.correct} / {score.total}
            </p>
            <p className="text-muted">
              {score.correct === score.total
                ? "Perfect score! Your handshapes are locked in."
                : "Nice work — review the letters you missed in the Learning Pathway."}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-green-700"
            >
              Finish Quiz 🎉
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <p className="text-sm font-bold uppercase tracking-wide text-purple">
                  How do you sign this letter?
                </p>
                <h2 className="text-5xl font-extrabold tracking-tight text-espresso">
                  {currentItem.word.toUpperCase()}
                </h2>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-espresso/60">
                    Describe the handshape and hand movement
                  </label>
                  <textarea
                    value={userAnswer}
                    onChange={(event) => setUserAnswer(event.target.value)}
                    disabled={isRevealed}
                    rows={3}
                    placeholder="e.g. Which fingers are extended? Where is the thumb? Is there any movement?"
                    className="w-full rounded-2xl border border-espresso/10 bg-white px-4 py-3 text-sm outline-none focus:border-purple disabled:bg-espresso/5"
                  />
                </div>

                {!isRevealed ? (
                  <button
                    type="button"
                    onClick={revealAnswer}
                    className="rounded-2xl bg-purple px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
                  >
                    Show Hand Sign
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-espresso/10 bg-white/70 p-4 backdrop-blur-md">
                      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">
                        Correct handshape
                      </p>
                      <p className="text-sm leading-relaxed text-espresso/90">
                        {currentItem.description}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => scoreAndAdvance(true)}
                        className="flex-1 rounded-2xl bg-green-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-700"
                      >
                        I got it right
                      </button>
                      <button
                        type="button"
                        onClick={() => scoreAndAdvance(false)}
                        className="flex-1 rounded-2xl border border-espresso/10 bg-white px-4 py-3 text-sm font-bold text-espresso/70 transition hover:bg-espresso/5"
                      >
                        I got it wrong
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <HandVisionPanel
                word={currentItem.word}
                visualCue={isRevealed ? currentItem.visualCue : "Handshape hidden until revealed"}
                description={isRevealed ? currentItem.description : undefined}
                trackingStatus={isRevealed ? "active" : "searching"}
                index={currentIndex}
                total={total}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
