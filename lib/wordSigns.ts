import { VocabItem } from "./types";
import { VOCABULARY, findVocabSign, normalizeWord } from "./vocabulary";

/**
 * Compatibility adapter over the full structured vocabulary in ./vocabulary.
 * WORD_SIGNS maps normalized-uppercase words to their entries.
 */
export const WORD_SIGNS: Record<string, VocabItem> = Object.fromEntries(
  VOCABULARY.map((item) => [item.word.toUpperCase(), item]),
);

export function normalizeWordKey(input: string): string {
  return normalizeWord(input).toUpperCase();
}

export function findWordSign(input: string): VocabItem | null {
  return findVocabSign(input);
}
