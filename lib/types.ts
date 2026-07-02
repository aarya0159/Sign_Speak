export type TabKey =
  | "dashboard"
  | "lessons"
  | "text-to-sign"
  | "sign-to-text"
  | "dictionary"
  | "ai-tutor";

export interface VocabItem {
  word: string;
  type: "Letter" | "Greeting" | "Emotion" | "Phrase" | "Word";
  description: string;
  visualCue: string;
}

export type Tier = "beginner" | "intermediate" | "advanced";

export interface CurriculumModule {
  id: string;
  title: string;
  summary: string;
  items: VocabItem[];
}
