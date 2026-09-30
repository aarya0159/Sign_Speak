"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { DashboardTab, DictionaryTab, TextToSignTab } from "@/components/HomeTabs";
import SignToTextTab from "@/components/SignToTextTab";
import QuizModal from "@/components/QuizModal";
import { TabKey } from "@/lib/types";
import { DashboardStats, getDashboardStats, recordActivity } from "@/lib/stats";
import { useSessionTimer } from "@/lib/useSessionTimer";

const TAB_KEYS: TabKey[] = [
  "dashboard",
  "lessons",
  "text-to-sign",
  "sign-to-text",
  "dictionary",
  "ai-tutor",
];

function isTabKey(value: string | null): value is TabKey {
  return value !== null && (TAB_KEYS as string[]).includes(value);
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<TabKey>(
    isTabKey(requestedTab) ? requestedTab : "dashboard",
  );
  const [userName, setUserName] = useState("Learner");
  const [stats, setStats] = useState<DashboardStats>({
    streak: 0,
    studiedThisWeek: 0,
    timeSpentMinutes: 0,
    lessonsCompleted: 0,
  });
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  useSessionTimer();

  useEffect(() => {
    const storedName = localStorage.getItem("signspeak_user_name");
    if (storedName) setUserName(storedName);

    setStats(recordActivity());
  }, []);

  useEffect(() => {
    if (requestedTab === "ai-tutor") router.replace("/tutor");
  }, [requestedTab, router]);

  function handleNavigate(tab: TabKey) {
    if (tab === "lessons") {
      router.push("/lessons");
      return;
    }
    if (tab === "ai-tutor") {
      router.push("/tutor");
      return;
    }
    setActiveTab(tab);
  }

  function handleLogout() {
    localStorage.removeItem("signspeak_user_name");
    localStorage.removeItem("signspeak_user_email");
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream md:flex-row">
      <Sidebar activeTab={activeTab} onNavigate={handleNavigate} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto px-6 py-8 pb-24 sm:px-10 md:pb-8">
        <div key={activeTab} className="animate-fade-up">
          {activeTab === "dashboard" && (
            <DashboardTab
              userName={userName}
              stats={stats}
              onContinueLesson={() => router.push("/lessons")}
              onStartQuiz={() => setIsQuizOpen(true)}
            />
          )}
          {activeTab === "text-to-sign" && <TextToSignTab />}
          {activeTab === "sign-to-text" && <SignToTextTab />}
          {activeTab === "dictionary" && <DictionaryTab onStartQuiz={() => setIsQuizOpen(true)} />}
        </div>
      </main>

      {isQuizOpen && <QuizModal onClose={() => setIsQuizOpen(false)} />}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
