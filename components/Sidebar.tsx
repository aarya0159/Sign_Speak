"use client";

import { TabKey } from "@/lib/types";

interface NavItem {
  key: TabKey;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard Home", icon: "🏠" },
  { key: "lessons", label: "Lessons", icon: "📚" },
  { key: "text-to-sign", label: "Text to Sign", icon: "⌨️" },
  { key: "sign-to-text", label: "Sign to Text", icon: "📷" },
  { key: "dictionary", label: "Dictionary & Quizzes", icon: "📖" },
  { key: "ai-tutor", label: "AI Tutor", icon: "🤖" },
];

interface SidebarProps {
  activeTab: TabKey;
  onNavigate: (tab: TabKey) => void;
  onLogout: () => void;
}

export default function Sidebar({ activeTab, onNavigate, onLogout }: SidebarProps) {
  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col justify-between border-r border-espresso/10 bg-white/50 px-4 py-6 backdrop-blur-md">
      <div>
        <div className="mb-8 flex items-center gap-2 px-2">
          <span
            className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-coral to-honey shadow-warm-sm"
            aria-hidden="true"
          />
          <span className="text-lg font-extrabold tracking-tight text-espresso">SignSpeak AI</span>
        </div>

        <nav className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onNavigate(item.key)}
                className={`flex w-full items-center gap-3 rounded-full px-4 py-3 text-left text-sm font-bold transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-peach to-peach/40 text-coral-deep shadow-warm-sm border border-coral/20"
                    : "border border-transparent text-espresso/70 hover:bg-peach/50 hover:text-coral-deep hover:translate-x-0.5"
                }`}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="w-full rounded-full border border-rose/30 bg-rose/10 px-4 py-3 text-sm font-bold text-rose transition hover:bg-rose/20"
      >
        Log Out Account
      </button>
    </aside>
  );
}
