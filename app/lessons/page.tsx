"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import FlashcardModal from "@/components/FlashcardModal";
import { curriculumData, tierLabels } from "@/lib/curriculumData";
import { CurriculumModule, TabKey, Tier } from "@/lib/types";

const TIERS: Tier[] = ["beginner", "intermediate", "advanced"];

interface StoredStats {
  streak: number;
  studiedThisWeek: number;
  timeSpentMinutes: number;
  lessonsCompleted: number;
}

const DEFAULT_STATS: StoredStats = {
  streak: 6,
  studiedThisWeek: 4,
  timeSpentMinutes: 128,
  lessonsCompleted: 12,
};

function markModuleComplete(moduleId: string) {
  let stats: StoredStats = DEFAULT_STATS;
  const stored = localStorage.getItem("signspeak_stats");
  if (stored) {
    try {
      stats = { ...DEFAULT_STATS, ...JSON.parse(stored) };
    } catch {
      stats = DEFAULT_STATS;
    }
  }

  const completedModules = new Set<string>(
    JSON.parse(localStorage.getItem("signspeak_completed_modules") || "[]"),
  );

  if (!completedModules.has(moduleId)) {
    completedModules.add(moduleId);
    stats = { ...stats, lessonsCompleted: stats.lessonsCompleted + 1 };
    localStorage.setItem("signspeak_stats", JSON.stringify(stats));
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

  function handleSidebarNavigate(tab: TabKey) {
    if (tab === "lessons") return;
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
    <div className="flex min-h-screen bg-cream">
      <Sidebar activeTab="lessons" onNavigate={handleSidebarNavigate} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto px-10 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-espresso">
            Learning Pathway
          </h1>
          <p className="mt-1 text-muted">
            Progress through structured tiers, one module at a time.
          </p>
        </div>

        <div className="mb-8 inline-flex rounded-2xl border border-espresso/10 bg-white/70 p-1 backdrop-blur-md">
          {TIERS.map((tier) => {
            const isActive = tier === activeTier;
            return (
              <button
                key={tier}
                type="button"
                onClick={() => setActiveTier(tier)}
                className={`rounded-xl px-5 py-2 text-sm font-bold transition ${
                  isActive ? "bg-purple text-white" : "text-espresso/60 hover:text-espresso"
                }`}
              >
                {tierLabels[tier]}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {modulesForTier.map((module) => {
            const isComplete = completedModules.has(module.id);
            return (
              <div
                key={module.id}
                className="flex flex-col justify-between rounded-2xl border border-espresso/10 bg-white/70 p-6 backdrop-blur-md"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-full bg-purple-soft px-3 py-1 text-xs font-bold text-purple">
                      {module.items.length} cards
                    </span>
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
                  className="mt-6 w-full rounded-2xl bg-purple py-3 text-sm font-bold text-white transition hover:opacity-90"
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
