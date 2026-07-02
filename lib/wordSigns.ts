import { VocabItem } from "./types";

// A small, verified dictionary of dedicated whole-word ASL signs. Real ASL
// vocabulary is signed as a single unit, not spelled out letter by letter —
// fingerspelling is reserved for names and words without an established sign.
// Descriptions are cross-checked against Lifeprint ASL University, Handspeak,
// and Signing Savvy.
export const WORD_SIGNS: Record<string, VocabItem> = {
  HELLO: {
    word: "Hello",
    type: "Word",
    description:
      "Open flat hand near the temple, palm facing forward, moves outward and slightly downward in a small arc, similar to a relaxed salute.",
    visualCue: "Open palm plane · outward temple arc",
  },
  "THANK YOU": {
    word: "Thank you",
    type: "Word",
    description:
      "Flat hand touches the chin with the fingertips, palm facing inward, then moves forward and down toward the person being thanked.",
    visualCue: "Flat palm plane · chin-to-forward path",
  },
  PLEASE: {
    word: "Please",
    type: "Word",
    description:
      "Open flat hand, fingers together and thumb extended, rests on the chest and rubs in a smooth, circular motion.",
    visualCue: "Flat palm · circular chest rub",
  },
  YES: {
    word: "Yes",
    type: "Word",
    description:
      "Hand forms a closed fist (like the letter S) and nods up and down at the wrist, mimicking a head nodding yes.",
    visualCue: "Closed fist · wrist nodding motion",
  },
  NO: {
    word: "No",
    type: "Word",
    description:
      "The index and middle fingers, bent at the knuckle, tap against the thumb repeatedly in front of the body, blending the shapes of the letters N and O.",
    visualCue: "Bent pinch · repeated N-O tap",
  },
  "I LOVE YOU": {
    word: "I love you",
    type: "Word",
    description:
      "Thumb, index finger, and pinky extend outward while the middle and ring fingers fold down, palm facing outward — the universal ILY handshape, often given a small outward wave.",
    visualCue: "ILY handshape · palm-out, middle/ring folded",
  },
};

export function normalizeWordKey(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, " ");
}

export function findWordSign(input: string): VocabItem | null {
  return WORD_SIGNS[normalizeWordKey(input)] ?? null;
}
