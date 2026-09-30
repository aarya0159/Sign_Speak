"use client";

import { useState } from "react";
import Image from "next/image";
import { Bot, BookOpen, Camera, Home, Keyboard, LibraryBig, LogOut, type LucideIcon } from "lucide-react";
import { TabKey } from "@/lib/types";

interface NavItem {
  key: TabKey;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard Home", icon: Home },
  { key: "lessons", label: "Lessons", icon: BookOpen },
  { key: "text-to-sign", label: "Text to Sign", icon: Keyboard },
  { key: "sign-to-text", label: "Sign to Text", icon: Camera },
  { key: "dictionary", label: "Dictionary & Quizzes", icon: LibraryBig },
  { key: "ai-tutor", label: "AI Tutor", icon: Bot },
];

interface SidebarProps {
  activeTab: TabKey;
  onNavigate: (tab: TabKey) => void;
  onLogout: () => void;
}

export default function Sidebar({ activeTab, onNavigate, onLogout }: SidebarProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* Desktop / tablet: hover-expand rail */}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={`sticky top-0 hidden h-screen shrink-0 flex-col justify-between overflow-hidden border-r border-espresso/10 bg-white/50 py-6 backdrop-blur-md transition-[width] duration-300 ease-out md:flex ${
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
              <Image src="/logo.png" alt="SignSpeak" width={44} height={44} className="rounded-full shadow-warm-sm" />
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
                  <item.icon aria-hidden="true" className="h-5 w-5 shrink-0" />
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
          className={`flex w-full items-center justify-center gap-2 rounded-full border border-rose/30 bg-rose/10 py-3 text-sm font-bold text-rose transition hover:bg-rose/20 ${
            expanded ? "px-4" : "px-0"
          }`}
        >
          <LogOut aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span
            className={`overflow-hidden whitespace-nowrap transition-all duration-200 ${
              expanded ? "max-w-[10rem] opacity-100" : "max-w-0 opacity-0"
            }`}
          >
            Log Out Account
          </span>
        </button>
      </aside>

      {/* Mobile: top bar with big logo + bottom tab bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-espresso/10 bg-white/70 px-4 py-3 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="SignSpeak" width={40} height={40} className="rounded-full shadow-warm-sm" />
          <span className="text-lg font-extrabold tracking-tight text-espresso">SignSpeak AI</span>
        </div>
        <button
          type="button"
          onClick={onLogout}
          aria-label="Log Out Account"
          className="rounded-full border border-rose/30 bg-rose/10 p-2 text-rose"
        >
          <LogOut aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-espresso/10 bg-white/90 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
        aria-label="Primary"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              aria-label={item.label}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-bold transition-colors ${
                isActive ? "text-coral-deep" : "text-espresso/60"
              }`}
            >
              <item.icon aria-hidden="true" className="h-5 w-5" />
              <span className="leading-tight">{item.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
