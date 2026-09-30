"use client";

import { useState } from "react";
import Image from "next/image";
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
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`sticky top-0 flex h-screen shrink-0 flex-col justify-between overflow-hidden border-r border-espresso/10 bg-white/50 py-6 backdrop-blur-md transition-[width] duration-300 ease-out ${
        expanded ? "w-64 px-4" : "w-20 px-2"
      }`}
    >
      <div>
        <div className={`mb-8 flex items-center gap-2 px-2 ${expanded ? "" : "justify-center"}`}>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
            className="shrink-0 rounded-full transition hover:opacity-80"
          >
            <Image src="/logo.png" alt="SignSpeak" width={28} height={28} className="rounded-full shadow-warm-sm" />
          </button>
          <span
            className={`overflow-hidden whitespace-nowrap text-lg font-extrabold tracking-tight text-espresso transition-all duration-200 ${
              expanded ? "max-w-[10rem] opacity-100" : "max-w-0 opacity-0"
            }`}
          >
            SignSpeak AI
          </span>
        </div>

        <nav className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onNavigate(item.key)}
                title={item.label}
                className={`flex w-full items-center gap-3 rounded-full px-4 py-3 text-left text-sm font-bold transition-all duration-300 ${
                  expanded ? "" : "justify-center px-0"
                } ${
                  isActive
                    ? "bg-gradient-to-r from-peach to-peach/40 text-coral-deep shadow-warm-sm border border-coral/20"
                    : "border border-transparent text-espresso/70 hover:bg-peach/50 hover:text-coral-deep hover:translate-x-0.5"
                }`}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span
                  className={`overflow-hidden whitespace-nowrap transition-all duration-200 ${
                    expanded ? "max-w-[10rem] opacity-100" : "max-w-0 opacity-0"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <button
        type="button"
        onClick={onLogout}
        title="Log Out Account"
        className={`w-full rounded-full border border-rose/30 bg-rose/10 py-3 text-sm font-bold text-rose transition hover:bg-rose/20 ${
          expanded ? "px-4" : "px-0"
        }`}
      >
        <span
          className={`block overflow-hidden whitespace-nowrap transition-all duration-200 ${
            expanded ? "opacity-100" : "opacity-0"
          }`}
        >
          {expanded ? "Log Out Account" : "⎋"}
        </span>
      </button>
    </aside>
  );
}
