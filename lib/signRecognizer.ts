import { FINGER_JOINTS, FINGER_NAMES, Point } from "@/lib/handPose";
import { Curls, HAND_SHAPES, LETTER_CURLS, MotionKey } from "@/lib/handShapes";
import { CAMERA_SIGN_WORDS, findVocabSign } from "@/lib/vocabulary";

export interface Point3D extends Point {
  z?: number;
}

export interface SignMatch {
  word: string;
  description: string;
  confidence: number;
  isScriptedWord: boolean;
  motionUsed: DetectedMotion;
}

export type DetectedMotion = "still" | "nod" | "shake" | "circle" | "move";

// ---------- Handshape ----------

const EXTENSION_RATIO_THRESHOLD = 1.15;

function distance(a: Point3D, b: Point3D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/** Per finger: is it extended? Compares tip-to-wrist vs. knuckle-to-wrist distance. */
export function extendedVectorFromLandmarks(landmarks: Point3D[]): boolean[] {
  const wrist = landmarks[0];
  return FINGER_NAMES.map((name) => {
    const { mcp, joints } = FINGER_JOINTS[name];
    const tip = landmarks[joints[2]];
    return distance(wrist, tip) > distance(wrist, landmarks[mcp]) * EXTENSION_RATIO_THRESHOLD;
  });
}

function curlsToExtended(curls: Curls): boolean[] {
  return curls.map((curl) => curl < 0.45);
}

function handshapeScore(expected: boolean[], live: boolean[]): number {
  return expected.reduce((sum, value, i) => sum + (value === live[i] ? 1 : 0), 0);
}

// ---------- Motion classification ----------

export interface WristSample {
  x: number;
  y: number;
  t: number;
}

const MOTION_WINDOW_MS = 900;
const STILL_PATH_THRESHOLD = 0.06; // normalized units of total travel

/**
 * Classifies recent wrist movement from a rolling window of samples
 * (normalized 0-1 coords). Distinguishes stillness, vertical nodding/tapping,
 * horizontal shaking, circular motion, and directed travel.
 */
export function classifyMotion(history: WristSample[]): DetectedMotion {
  const now = history.length > 0 ? history[history.length - 1].t : 0;
  const window = history.filter((sample) => now - sample.t <= MOTION_WINDOW_MS);
  if (window.length < 4) return "still";

  let pathLength = 0;
  let xReversals = 0;
  let yReversals = 0;
  let angleSweep = 0;
  let prevDx = 0;
  let prevDy = 0;
  let prevAngle: number | null = null;

  for (let i = 1; i < window.length; i += 1) {
    const dx = window[i].x - window[i - 1].x;
    const dy = window[i].y - window[i - 1].y;
    pathLength += Math.sqrt(dx * dx + dy * dy);

    if (i > 1) {
      if (Math.sign(dx) !== 0 && Math.sign(prevDx) !== 0 && Math.sign(dx) !== Math.sign(prevDx)) xReversals += 1;
      if (Math.sign(dy) !== 0 && Math.sign(prevDy) !== 0 && Math.sign(dy) !== Math.sign(prevDy)) yReversals += 1;
    }

    if (Math.abs(dx) + Math.abs(dy) > 0.004) {
      const angle = Math.atan2(dy, dx);
      if (prevAngle !== null) {
        let delta = angle - prevAngle;
        while (delta > Math.PI) delta -= 2 * Math.PI;
        while (delta < -Math.PI) delta += 2 * Math.PI;
        angleSweep += delta;
      }
      prevAngle = angle;
    }

    prevDx = dx;
    prevDy = dy;
  }

  const first = window[0];
  const last = window[window.length - 1];
  const netDisplacement = Math.sqrt((last.x - first.x) ** 2 + (last.y - first.y) ** 2);

  if (pathLength < STILL_PATH_THRESHOLD) return "still";
  if (Math.abs(angleSweep) > 3.5 && netDisplacement < pathLength * 0.45) return "circle";
  if (xReversals >= 2 && xReversals > yReversals) return "shake";
  if (yReversals >= 2 && yReversals >= xReversals) return "nod";
  return "move";
}

/** Maps a sign's scripted motion to the coarse classes the camera can detect. */
function motionClassOf(motion: MotionKey): DetectedMotion {
  switch (motion) {
    case "none":
      return "still";
    case "tap":
    case "nod":
    case "updown":
      return "nod";
    case "shake":
    case "wiggle":
    case "twist":
      return "shake";
    case "circle":
      return "circle";
    case "openClose":
      return "still";
    default:
      return "move"; // arcOut, arcDown, forward, down, up
  }
}

// ---------- Reference databases ----------

interface CameraSign {
  word: string;
  description: string;
  extended: boolean[];
  locationY: number; // expected wrist height in frame, 0 = top
  motionClass: DetectedMotion;
}

const LOCATION_Y: Record<string, number> = {
  temple: 0.22,
  forehead: 0.2,
  eye: 0.25,
  nose: 0.28,
  cheek: 0.28,
  chin: 0.34,
  mouth: 0.32,
  ear: 0.25,
  neck: 0.42,
  chest: 0.58,
  heart: 0.56,
  stomach: 0.72,
  side: 0.5,
  neutral: 0.55,
  low: 0.75,
};

const CAMERA_SIGNS: CameraSign[] = CAMERA_SIGN_WORDS.map((word) => {
  const entry = findVocabSign(word)!;
  const step = entry.steps![0];
  const curls = Array.isArray(step.shape) ? step.shape : HAND_SHAPES[step.shape];
  return {
    word: entry.word,
    description: entry.description,
    extended: curlsToExtended(curls as Curls),
    locationY: LOCATION_Y[step.location] ?? 0.55,
    motionClass: motionClassOf(step.motion),
  };
});

const LETTER_SIGNS = Object.entries(LETTER_CURLS).map(([letter, curls]) => ({
  word: letter,
  extended: curlsToExtended(curls),
}));

const WORD_MIN_SHAPE_SCORE = 4; // of 5 fingers
const LOCATION_TOLERANCE = 0.22;

export interface Candidate {
  word: string;
  description: string;
  /** 0-1 normalized score for this frame */
  confidence: number;
  isScriptedWord: boolean;
}

/**
 * Scores the current landmark-sequence features against every reference sign
 * and returns a ranked hypothesis array — the per-frame emission the streaming
 * gloss-free decoder consumes. (This geometric scorer stands in where a trained
 * ViT/CTC encoder would plug in; the decoder interface is identical.)
 */
export function scoreCandidates(
  liveExtended: boolean[],
  liveWristY: number | undefined,
  motion: DetectedMotion,
): Candidate[] {
  const candidates: Candidate[] = [];

  for (const reference of CAMERA_SIGNS) {
    const shapeScore = handshapeScore(reference.extended, liveExtended);
    if (shapeScore < WORD_MIN_SHAPE_SCORE - 1) continue;

    const locationError =
      liveWristY !== undefined ? Math.abs(liveWristY - reference.locationY) : LOCATION_TOLERANCE;
    const locationScore = Math.max(0, 1 - locationError / LOCATION_TOLERANCE) * 1.5;
    const motionScore = reference.motionClass === motion ? 1.5 : motion === "still" ? 0.4 : 0;

    candidates.push({
      word: reference.word,
      description: reference.description,
      confidence: Math.min(1, (shapeScore + locationScore + motionScore) / 8),
      isScriptedWord: true,
    });
  }

  const letterScores = LETTER_SIGNS.map((reference) => ({
    reference,
    score: handshapeScore(reference.extended, liveExtended),
  })).sort((a, b) => b.score - a.score);

  for (const { reference, score } of letterScores.slice(0, 2)) {
    candidates.push({
      word: reference.word,
      description: `Fingerspelled letter ${reference.word}`,
      // Letters are shape-only evidence, so cap them slightly below word signs
      confidence: (score / FINGER_NAMES.length) * 0.82,
      isScriptedWord: false,
    });
  }

  return candidates.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}

/**
 * Single best match — thin wrapper over the streaming candidate scorer.
 */
export function matchSign(
  liveExtended: boolean[],
  liveWristY: number | undefined,
  motion: DetectedMotion,
): SignMatch {
  const [best] = scoreCandidates(liveExtended, liveWristY, motion);
  return {
    word: best.word,
    description: best.description,
    confidence: best.confidence,
    isScriptedWord: best.isScriptedWord,
    motionUsed: motion,
  };
}
