"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import FlashcardModal from "@/components/FlashcardModal";
import { curriculumData, tierLabels } from "@/lib/curriculumData";
import { CurriculumModule, TabKey, Tier } from "@/lib/types";
import { incrementLessonsCompleted, recordActivity } from "@/lib/stats";
import { useSessionTimer } from "@/lib/useSessionTimer";

const TIERS: Tier[] = ["beginner", "intermediate", "advanced"];

function markModuleComplete(moduleId: string) {
  const completedModules = new Set<string>(
    JSON.parse(localStorage.getItem("signspeak_completed_modules") || "[]"),
  );

  if (!completedModules.has(moduleId)) {
    completedModules.add(moduleId);
    incrementLessonsCompleted();
    localStorage.setItem(
      "signspeak_completed_modules",
      JSON.stringify(Array.from(completedModules)),
    );
  }

  return completedModules;
}

export default function LessonsPage() {
  const router = useRouter();
  const [activeTier, setActiveTier] = useState<Tier>("beginner");
  const [selectedModule, setSelectedModule] = useState<CurriculumModule | null>(null);
  const [completedModules, setCompletedModules] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      return new Set(JSON.parse(localStorage.getItem("signspeak_completed_modules") || "[]"));
    } catch {
      return new Set();
    }
  });

  useSessionTimer();

  useEffect(() => {
    recordActivity();
  }, []);

  function handleSidebarNavigate(tab: TabKey) {
    if (tab === "lessons") return;
    if (tab === "ai-tutor") {
      router.push("/tutor");
      return;
    }
    router.push(`/home?tab=${tab}`);
  }

  function handleLogout() {
    localStorage.removeItem("signspeak_user_name");
    localStorage.removeItem("signspeak_user_email");
    router.push("/login");
  }

  function handleModuleComplete(moduleId: string) {
    const updated = markModuleComplete(moduleId);
    setCompletedModules(new Set(updated));
  }

  const modulesForTier = curriculumData[activeTier];

  return (
    <div className="flex min-h-screen flex-col bg-cream md:flex-row">
      <Sidebar activeTab="lessons" onNavigate={handleSidebarNavigate} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto px-6 py-8 pb-24 sm:px-10 md:pb-8">
        <div className="animate-fade-up mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Learning <span className="text-sunset">Pathway</span>
          </h1>
          <p className="mt-1 text-muted">One module at a time.</p>
        </div>

        <div className="animate-fade-up mb-8 -mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
          <div className="inline-flex shrink-0 rounded-full border border-espresso/10 bg-white/70 p-1 backdrop-blur-md">
            {TIERS.map((tier) => {
              const isActive = tier === activeTier;
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setActiveTier(tier)}
                  className={`shrink-0 whitespace-nowrap rounded-full px-5 py-2 text-sm font-bold transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-coral to-honey text-white shadow-warm-sm"
                      : "text-espresso/60 hover:text-coral-deep"
                  }`}
                >
                  {tierLabels[tier]}
                </button>
              );
            })}
          </div>
        </div>

        <div key={activeTier} className="animate-fade-up grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {modulesForTier.map((module) => {
            const isComplete = completedModules.has(module.id);
            return (
              <div
                key={module.id}
                className="card-warm card-warm-hover flex flex-col justify-between p-6"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="chip-warm">{module.items.length} cards</span>
                    {isComplete && (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                        Completed
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-extrabold text-espresso">{module.title}</h3>
                  <p className="mt-1 text-sm text-muted">{module.summary}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedModule(module)}
                  className="btn-sunset mt-6 w-full py-3 text-sm"
                >
                  Study Lesson
                </button>
              </div>
            );
          })}
        </div>
      </main>

      {selectedModule && (
        <FlashcardModal
          module={selectedModule}
          onClose={() => setSelectedModule(null)}
          onComplete={handleModuleComplete}
        />
      )}
    </div>
  );
}
