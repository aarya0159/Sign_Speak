import { curriculumData } from "@/lib/curriculumData";
import { FINGER_JOINTS, FINGER_NAMES, Point, extendedProfileFromDescription } from "@/lib/handPose";
import { WORD_SIGNS } from "@/lib/wordSigns";

export interface SignMatch {
  word: string;
  description: string;
  confidence: number;
  isScriptedWord: boolean;
}

interface ReferenceSign {
  word: string;
  description: string;
  extended: boolean[];
}

type PositionHint = "top" | "upper-mid" | "lower";

interface ScriptedSign extends ReferenceSign {
  positionHint: PositionHint | null;
}

const POSITION_ZONE_CENTER: Record<PositionHint, number> = {
  top: 0.2,
  "upper-mid": 0.45,
  lower: 0.75,
};

function positionHintFromDescription(description: string): PositionHint | null {
  const lower = description.toLowerCase();
  if (["temple", "forehead", "ear", "head"].some((keyword) => lower.includes(keyword))) return "top";
  if (["chin", "mouth", "nose", "cheek"].some((keyword) => lower.includes(keyword))) return "upper-mid";
  if (["chest", "torso"].some((keyword) => lower.includes(keyword))) return "lower";
  return null;
}

// A small, hand-curated ("scripted") set of whole-word signs — the same six
// taught in Text to Sign — that the live camera recognizer is specifically
// tuned to catch, rather than relying on generic classification across every
// possible sign. Open-hand signs made near the head (Hello/Thank you/Please)
// share an identical finger-extended profile, so they're told apart using
// where the wrist sits vertically in the camera frame as a secondary signal.
const SCRIPTED_WORD_SIGNS: ScriptedSign[] = Object.values(WORD_SIGNS).map((item) => ({
  word: item.word,
  description: item.description,
  extended: extendedProfileFromDescription(item.description),
  positionHint: positionHintFromDescription(item.description),
}));

// Static handshapes only: fingerspelled letters hold a single pose, unlike
// motion-based phrases/emotions, so they're the only entries a single camera
// frame can be reasonably matched against as a fallback.
const ALPHABET_REFERENCE_SIGNS: ReferenceSign[] = curriculumData.beginner
  .find((module) => module.id === "alphabet")!
  .items.map((item) => ({
    word: item.word,
    description: item.description,
    extended: extendedProfileFromDescription(item.description),
  }));

const EXTENSION_RATIO_THRESHOLD = 1.15;
const SCRIPTED_WORD_MIN_SCORE = 4; // out of 5 fingers must agree before trusting a word match

export interface Point3D extends Point {
  z?: number;
}

function distance(a: Point3D, b: Point3D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/** Determines, per finger, whether it is extended by comparing tip-to-wrist vs. mcp-to-wrist distance. */
export function extendedVectorFromLandmarks(landmarks: Point3D[]): boolean[] {
  const wrist = landmarks[0];
  return FINGER_NAMES.map((name) => {
    const { mcp, joints } = FINGER_JOINTS[name];
    const tip = landmarks[joints[2]];
    const tipDistance = distance(wrist, tip);
    const mcpDistance = distance(wrist, landmarks[mcp]);
    return tipDistance > mcpDistance * EXTENSION_RATIO_THRESHOLD;
  });
}

function handshapeScore(reference: { extended: boolean[] }, liveExtended: boolean[]): number {
  return reference.extended.reduce((total, extended, i) => total + (extended === liveExtended[i] ? 1 : 0), 0);
}

/**
 * Matches a live extended/curled finger signature (plus optional normalized wrist
 * y-position, 0 = top of frame) against the scripted word database first, falling
 * back to the full manual alphabet when no word is a confident match.
 */
export function matchSign(liveExtended: boolean[], liveWristY?: number): SignMatch {
  let bestWord: ScriptedSign | null = null;
  let bestWordScore = -1;
  let bestWordPositionPenalty = Infinity;

  for (const reference of SCRIPTED_WORD_SIGNS) {
    const score = handshapeScore(reference, liveExtended);
    const positionPenalty =
      reference.positionHint && liveWristY !== undefined
        ? Math.abs(liveWristY - POSITION_ZONE_CENTER[reference.positionHint])
        : 0.5;

    const isBetter =
      score > bestWordScore || (score === bestWordScore && positionPenalty < bestWordPositionPenalty);

    if (isBetter) {
      bestWordScore = score;
      bestWordPositionPenalty = positionPenalty;
      bestWord = reference;
    }
  }

  if (bestWord && bestWordScore >= SCRIPTED_WORD_MIN_SCORE) {
    return {
      word: bestWord.word,
      description: bestWord.description,
      confidence: bestWordScore / FINGER_NAMES.length,
      isScriptedWord: true,
    };
  }

  let bestLetter: ReferenceSign = ALPHABET_REFERENCE_SIGNS[0];
  let bestLetterScore = -1;

  for (const reference of ALPHABET_REFERENCE_SIGNS) {
    const score = handshapeScore(reference, liveExtended);
    if (score > bestLetterScore) {
      bestLetterScore = score;
      bestLetter = reference;
    }
  }

  return {
    word: bestLetter.word,
    description: bestLetter.description,
    confidence: bestLetterScore / FINGER_NAMES.length,
    isScriptedWord: false,
  };
}
