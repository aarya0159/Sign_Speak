import { BASE_LANDMARKS, FINGER_JOINTS, FINGER_NAMES, Point, lerp } from "./handPose";
import type { VocabItem } from "./types";

/**
 * Structured ASL pose system: every sign is described by explicit handshape
 * (per-finger curl), body location, and motion pattern — far more accurate
 * than inferring poses from free-text descriptions.
 */

/** Per-finger curl, 0 = fully extended, 1 = fully curled: [thumb, index, middle, ring, pinky] */
export type Curls = [number, number, number, number, number];

export const HAND_SHAPES = {
  open: [0, 0, 0, 0, 0] as Curls, // "5" hand, all fingers spread
  flat: [0.85, 0, 0, 0, 0] as Curls, // "B" hand, fingers together, thumb across
  fist: [0.6, 1, 1, 1, 1] as Curls, // "S" hand
  thumbFist: [0.3, 0.95, 0.95, 0.95, 0.95] as Curls, // "A" hand, thumb at side
  thumbUp: [0, 0.95, 0.95, 0.95, 0.95] as Curls, // thumbs-up / "10"
  flatO: [0.45, 0.5, 0.5, 0.5, 0.5] as Curls, // fingertips meet thumb
  O: [0.5, 0.6, 0.6, 0.6, 0.6] as Curls,
  C: [0.3, 0.4, 0.4, 0.4, 0.4] as Curls,
  one: [0.7, 0, 0.9, 0.9, 0.9] as Curls, // index point / "D"
  two: [0.8, 0, 0, 0.9, 0.9] as Curls, // "V" / "U" / "H"
  three: [0, 0, 0, 0.9, 0.9] as Curls, // thumb + index + middle
  four: [0.9, 0, 0, 0, 0] as Curls,
  claw: [0.2, 0.45, 0.45, 0.45, 0.45] as Curls, // bent "5"
  bentV: [0.8, 0.45, 0.45, 0.95, 0.95] as Curls,
  hook: [0.6, 0.5, 1, 1, 1] as Curls, // "X" hand
  L: [0, 0, 0.9, 0.9, 0.9] as Curls,
  Y: [0, 0.95, 0.95, 0.95, 0] as Curls,
  ILY: [0, 0, 0.95, 0.95, 0] as Curls,
  pinky: [0.75, 0.95, 0.95, 0.95, 0] as Curls, // "I" hand
  F: [0.5, 0.55, 0, 0, 0] as Curls, // thumb-index circle, rest up
  W: [0.75, 0, 0, 0, 0.95] as Curls,
} as const;

export type HandShapeKey = keyof typeof HAND_SHAPES;

/** Explicit fingerspelling handshapes A-Z (approximated on a 5-curl skeleton). */
export const LETTER_CURLS: Record<string, Curls> = {
  A: [0.35, 1, 1, 1, 1],
  B: [0.85, 0, 0, 0, 0],
  C: [0.3, 0.4, 0.4, 0.4, 0.4],
  D: [0.55, 0, 0.8, 0.8, 0.8],
  E: [0.7, 0.65, 0.65, 0.65, 0.65],
  F: [0.5, 0.55, 0, 0, 0],
  G: [0.3, 0, 1, 1, 1],
  H: [0.7, 0, 0, 1, 1],
  I: [0.8, 1, 1, 1, 0],
  J: [0.8, 1, 1, 1, 0],
  K: [0.4, 0, 0, 1, 1],
  L: [0, 0, 1, 1, 1],
  M: [0.9, 0.8, 0.8, 0.8, 1],
  N: [0.9, 0.8, 0.8, 1, 1],
  O: [0.45, 0.55, 0.55, 0.55, 0.55],
  P: [0.4, 0, 0.35, 1, 1],
  Q: [0.3, 0.3, 1, 1, 1],
  R: [0.8, 0, 0.08, 1, 1],
  S: [0.6, 1, 1, 1, 1],
  T: [0.7, 0.9, 1, 1, 1],
  U: [0.8, 0, 0, 1, 1],
  V: [0.8, 0, 0, 1, 1],
  W: [0.8, 0, 0, 0, 1],
  X: [0.6, 0.5, 1, 1, 1],
  Y: [0, 1, 1, 1, 0],
  Z: [0.7, 0, 0.9, 0.9, 0.9],
};

export const LOCATIONS = {
  neutral: { x: 110, y: 150, scale: 0.78 },
  temple: { x: 62, y: 64, scale: 0.58 },
  forehead: { x: 110, y: 56, scale: 0.58 },
  eye: { x: 94, y: 72, scale: 0.55 },
  nose: { x: 110, y: 82, scale: 0.55 },
  cheek: { x: 76, y: 88, scale: 0.55 },
  chin: { x: 110, y: 98, scale: 0.58 },
  mouth: { x: 110, y: 90, scale: 0.55 },
  ear: { x: 56, y: 78, scale: 0.55 },
  neck: { x: 110, y: 118, scale: 0.58 },
  chest: { x: 110, y: 168, scale: 0.7 },
  heart: { x: 92, y: 164, scale: 0.65 },
  stomach: { x: 110, y: 205, scale: 0.7 },
  side: { x: 168, y: 140, scale: 0.62 },
  low: { x: 110, y: 214, scale: 0.68 },
} as const;

export type LocationKey = keyof typeof LOCATIONS;

export type MotionKey =
  | "none"
  | "tap"
  | "circle"
  | "arcOut"
  | "arcDown"
  | "forward"
  | "down"
  | "up"
  | "nod"
  | "shake"
  | "twist"
  | "wiggle"
  | "openClose"
  | "updown";

export interface SignStep {
  shape: HandShapeKey | Curls;
  location: LocationKey;
  motion: MotionKey;
  label?: string;
}

export interface AnimFrame {
  curls: Curls;
  location: { x: number; y: number; scale: number };
  motion: MotionKey;
  label: string;
}

const HAND_CENTROID: Point = BASE_LANDMARKS.reduce(
  (sum, point) => ({
    x: sum.x + point.x / BASE_LANDMARKS.length,
    y: sum.y + point.y / BASE_LANDMARKS.length,
  }),
  { x: 0, y: 0 },
);

function curlsOf(shape: HandShapeKey | Curls): Curls {
  return Array.isArray(shape) ? shape : HAND_SHAPES[shape];
}

export function stepToFrame(step: SignStep, fallbackLabel: string): AnimFrame {
  return {
    curls: curlsOf(step.shape),
    location: LOCATIONS[step.location],
    motion: step.motion,
    label: step.label ?? fallbackLabel,
  };
}

export function letterFrame(letter: string): AnimFrame {
  const upper = letter.toUpperCase();
  const curls = LETTER_CURLS[upper] ?? HAND_SHAPES.open;
  const motion: MotionKey = upper === "J" ? "arcDown" : upper === "Z" ? "shake" : "none";
  return { curls, location: LOCATIONS.neutral, motion, label: upper };
}

/** Frames for any curriculum item: structured steps if present, letter shapes for single letters. */
export function framesForItem(item: VocabItem): AnimFrame[] {
  if (item.steps && item.steps.length > 0) {
    return item.steps.map((step) => stepToFrame(step, item.word));
  }
  if (item.word.length === 1 && LETTER_CURLS[item.word.toUpperCase()]) {
    return [letterFrame(item.word)];
  }
  return [{ curls: HAND_SHAPES.open, location: LOCATIONS.neutral, motion: "none", label: item.word }];
}

/** Builds the 21-point skeleton for a curl profile, placed at a location. `t` drives per-finger motion like wiggle. */
export function poseForFrame(frame: AnimFrame, t: number): Point[] {
  let curls: number[] = [...frame.curls];

  if (frame.motion === "wiggle") {
    curls = curls.map((curl, i) => clamp01(curl + 0.14 * Math.sin(2 * Math.PI * (t * 3 + i * 0.22))));
  } else if (frame.motion === "openClose") {
    const blend = 0.5 + 0.5 * Math.sin(2 * Math.PI * t * 1.5);
    curls = curls.map((curl, i) => curl + (HAND_SHAPES.flatO[i] - curl) * blend * 0.8);
  }

  const landmarks = BASE_LANDMARKS.map((point) => ({ ...point }));
  FINGER_NAMES.forEach((name, fingerIndex) => {
    const { mcp, joints } = FINGER_JOINTS[name];
    const anchor = landmarks[mcp];
    const [pipIdx, dipIdx, tipIdx] = joints;
    const curl = curls[fingerIndex];
    landmarks[pipIdx] = lerp(BASE_LANDMARKS[pipIdx], anchor, curl * 0.35);
    landmarks[dipIdx] = lerp(BASE_LANDMARKS[dipIdx], anchor, curl * 0.6);
    landmarks[tipIdx] = lerp(BASE_LANDMARKS[tipIdx], anchor, curl * 0.8);
  });

  const placed = landmarks.map((point) => ({
    x: frame.location.x + (point.x - HAND_CENTROID.x) * frame.location.scale,
    y: frame.location.y + (point.y - HAND_CENTROID.y) * frame.location.scale,
  }));

  return applyMotion(placed, frame.motion, t);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function easeLoop(t: number): number {
  // 0 → 1 over the cycle with a soft restart
  const p = t % 1;
  return p < 0.85 ? p / 0.85 : 1 - (p - 0.85) / 0.15;
}

/** Applies a rigid, time-parametric movement to the whole hand. */
export function applyMotion(points: Point[], motion: MotionKey, t: number): Point[] {
  const wrist = points[0];

  switch (motion) {
    case "none":
      return points;
    case "tap": {
      const dip = 7 * Math.abs(Math.sin(2 * Math.PI * t * 1.6));
      return points.map((p) => ({ x: p.x, y: p.y + dip }));
    }
    case "circle": {
      const dx = 11 * Math.cos(2 * Math.PI * t);
      const dy = 11 * Math.sin(2 * Math.PI * t);
      return points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
    }
    case "arcOut": {
      const p = easeLoop(t);
      const dx = 30 * p;
      const dy = -8 * p + 26 * p * p;
      return points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy }));
    }
    case "arcDown": {
      const p = easeLoop(t);
      const dx = 14 * Math.sin(Math.PI * p);
      const dy = 26 * p;
      return points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy }));
    }
    case "forward": {
      const p = easeLoop(t);
      const grow = 1 + 0.12 * p;
      return points.map((pt) => ({
        x: wrist.x + (pt.x - wrist.x) * grow,
        y: wrist.y + (pt.y - wrist.y) * grow + 12 * p,
      }));
    }
    case "down": {
      const p = easeLoop(t);
      return points.map((pt) => ({ x: pt.x, y: pt.y + 24 * p }));
    }
    case "up": {
      const p = easeLoop(t);
      return points.map((pt) => ({ x: pt.x, y: pt.y - 24 * p }));
    }
    case "nod": {
      const theta = 0.32 * Math.sin(2 * Math.PI * t * 1.5);
      return rotateAround(points, wrist, theta);
    }
    case "shake": {
      const dx = 10 * Math.sin(2 * Math.PI * t * 2.4);
      return points.map((p) => ({ x: p.x + dx, y: p.y }));
    }
    case "twist": {
      const squash = 0.7 + 0.3 * Math.abs(Math.cos(2 * Math.PI * t * 1.4));
      return points.map((p) => ({ x: wrist.x + (p.x - wrist.x) * squash, y: p.y }));
    }
    case "updown": {
      const dy = 9 * Math.sin(2 * Math.PI * t * 1.8);
      return points.map((p) => ({ x: p.x, y: p.y + dy }));
    }
    case "wiggle":
    case "openClose":
      return points; // handled at the curl level in poseForFrame
    default:
      return points;
  }
}

function rotateAround(points: Point[], origin: Point, theta: number): Point[] {
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  return points.map((p) => {
    const dx = p.x - origin.x;
    const dy = p.y - origin.y;
    return { x: origin.x + dx * cos - dy * sin, y: origin.y + dx * sin + dy * cos };
  });
}

// ---------- Continuous pose stream (gloss-free text-to-pose pipeline) ----------

export const FRAME_DURATION_MS = 1700;
const TRANSITION_MS = 380;

const IDLE_FRAME: AnimFrame = {
  curls: HAND_SHAPES.open,
  location: LOCATIONS.neutral,
  motion: "none",
  label: "",
};

function blendPoses(a: Point[], b: Point[], t: number): Point[] {
  const eased = t * t * (3 - 2 * t);
  return a.map((p, i) => ({
    x: p.x + (b[i].x - p.x) * eased,
    y: p.y + (b[i].y - p.y) * eased,
  }));
}

export interface PoseStreamSample {
  points: Point[];
  label: string;
  frameIndex: number;
  frameCount: number;
}

/**
 * Samples the continuous pose stream for a sign sequence at an arbitrary
 * timestamp. Rather than playing discrete clips back-to-back, every requested
 * timestamp yields interpolated joint coordinates — motions loop within each
 * sign, and sign boundaries are smoothly eased into each other, so a caller
 * sampling at 60 fps gets one fluid, non-choppy movement stream.
 */
export function poseStreamAt(frames: AnimFrame[] | undefined, elapsedMs: number): PoseStreamSample {
  const elapsed = Math.max(0, elapsedMs);

  if (!frames || frames.length === 0) {
    return {
      points: poseForFrame(IDLE_FRAME, (elapsed / 3000) % 1),
      label: "",
      frameIndex: 0,
      frameCount: 0,
    };
  }

  const totalDuration = frames.length * FRAME_DURATION_MS;
  const cycleTime = elapsed % totalDuration;
  const frameIndex = Math.min(frames.length - 1, Math.floor(cycleTime / FRAME_DURATION_MS));
  const frameTime = cycleTime - frameIndex * FRAME_DURATION_MS;
  const frame = frames[frameIndex];

  let points = poseForFrame(frame, frameTime / FRAME_DURATION_MS);

  if (frameTime < TRANSITION_MS && frames.length > 1) {
    const prevFrame = frames[(frameIndex - 1 + frames.length) % frames.length];
    const prevPose = poseForFrame(prevFrame, 1);
    points = blendPoses(prevPose, points, frameTime / TRANSITION_MS);
  }

  return { points, label: frame.label, frameIndex, frameCount: frames.length };
}
