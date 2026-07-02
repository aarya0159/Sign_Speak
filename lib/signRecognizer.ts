import { curriculumData } from "@/lib/curriculumData";
import { FINGER_JOINTS, FINGER_NAMES, Point, extendedProfileFromDescription } from "@/lib/handPose";

export interface SignMatch {
  word: string;
  description: string;
  confidence: number;
}

interface ReferenceSign {
  word: string;
  description: string;
  extended: boolean[];
}

// Static handshapes only: fingerspelled letters hold a single pose, unlike
// motion-based phrases/emotions, so they're the only entries a single camera
// frame can be reasonably matched against.
const REFERENCE_SIGNS: ReferenceSign[] = curriculumData.beginner
  .find((module) => module.id === "alphabet")!
  .items.map((item) => ({
    word: item.word,
    description: item.description,
    extended: extendedProfileFromDescription(item.description),
  }));

const EXTENSION_RATIO_THRESHOLD = 1.15;

function distance(a: Point3D, b: Point3D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export interface Point3D extends Point {
  z?: number;
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

/** Matches a live extended/curled finger signature against the alphabet reference database. */
export function matchSign(liveExtended: boolean[]): SignMatch {
  let best: ReferenceSign = REFERENCE_SIGNS[0];
  let bestScore = -1;

  for (const reference of REFERENCE_SIGNS) {
    const score = reference.extended.reduce(
      (total, extended, i) => total + (extended === liveExtended[i] ? 1 : 0),
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      best = reference;
    }
  }

  return {
    word: best.word,
    description: best.description,
    confidence: bestScore / FINGER_NAMES.length,
  };
}
