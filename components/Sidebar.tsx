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
];

interface SidebarProps {
  activeTab: TabKey;
  onNavigate: (tab: TabKey) => void;
  onLogout: () => void;
}

export default function Sidebar({ activeTab, onNavigate, onLogout }: SidebarProps) {
  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col justify-between border-r border-espresso/10 bg-white/70 px-4 py-6 backdrop-blur-md">
      <div>
        <div className="mb-8 flex items-center gap-2 px-2">
          <span className="h-3 w-3 rounded-full bg-purple" aria-hidden="true" />
          <span className="text-lg font-extrabold tracking-tight text-espresso">
            SignSpeak AI
          </span>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onNavigate(item.key)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold transition ${
                  isActive
                    ? "bg-purple-soft text-purple border border-purple/20"
                    : "text-espresso/70 hover:bg-purple-soft/60 border border-transparent"
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
        className="w-full rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100"
      >
        Log Out Account
      </button>
    </aside>
  );
}
