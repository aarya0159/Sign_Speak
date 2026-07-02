"use client";

import { useState } from "react";
import HandVisionPanel from "@/components/HandVisionPanel";
import { CurriculumModule } from "@/lib/types";

interface FlashcardModalProps {
  module: CurriculumModule;
  onClose: () => void;
  onComplete: (moduleId: string) => void;
}

export default function FlashcardModal({ module, onClose, onComplete }: FlashcardModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const total = module.items.length;
  const currentItem = module.items[currentIndex];
  const isLastCard = currentIndex === total - 1;
  const progressPercent = ((currentIndex + 1) / total) * 100;

  function goBack() {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }

  function goNext() {
    if (isLastCard) {
      onComplete(module.id);
      onClose();
      return;
    }
    setCurrentIndex((prev) => Math.min(total - 1, prev + 1));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/40 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-3xl border border-espresso/10 bg-cream p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-muted">{module.title}</p>
            <p className="text-xs text-muted">
              Card {currentIndex + 1} of {total}
            </p>
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
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="flex flex-col justify-center space-y-4">
            <p className="text-sm font-bold uppercase tracking-wide text-purple">
              {currentItem.type}
            </p>
            <h2 className="text-4xl font-extrabold tracking-tight text-espresso">
              {currentItem.word.toUpperCase()}
            </h2>

            <div className="rounded-2xl border border-espresso/10 bg-white/70 p-4 backdrop-blur-md">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">
                Physical manipulation guide
              </p>
              <p className="text-sm leading-relaxed text-espresso/90">{currentItem.description}</p>
            </div>
          </div>

          <HandVisionPanel
            word={currentItem.word}
            visualCue={currentItem.visualCue}
            description={currentItem.description}
            index={currentIndex}
            total={total}
          />
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={currentIndex === 0}
            className="rounded-2xl border border-espresso/10 bg-white/70 px-5 py-3 text-sm font-bold text-espresso/70 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Back
          </button>

          {isLastCard ? (
            <button
              type="button"
              onClick={goNext}
              className="rounded-2xl bg-green-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-green-700"
            >
              Finish Lesson 🎉
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className="rounded-2xl bg-purple px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
            >
              Next Word →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
