import type { SignStep } from "./handShapes";

export type TabKey =
  | "dashboard"
  | "lessons"
  | "text-to-sign"
  | "sign-to-text"
  | "dictionary"
  | "ai-tutor";

export interface VocabItem {
  word: string;
  /** Category badge, e.g. "Letter", "Greeting", "Food & Drink" */
  type: string;
  description: string;
  visualCue: string;
  /** Structured pose sequence; when present, drives the animated hand accurately. */
  steps?: SignStep[];
}

export type Tier = "beginner" | "intermediate" | "advanced";

export interface CurriculumModule {
  id: string;
  title: string;
  summary: string;
  items: VocabItem[];
}
