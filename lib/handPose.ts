export interface Point {
  x: number;
  y: number;
}

export const FINGER_NAMES = ["thumb", "index", "middle", "ring", "pinky"] as const;
export type FingerName = (typeof FINGER_NAMES)[number];

// Mirrors the MediaPipe Hand Landmarker's 21-point topology so synthetic
// and camera-detected landmarks can share the same rendering + bone list.
export const BASE_LANDMARKS: Point[] = [
  { x: 110, y: 230 }, // 0 wrist
  { x: 80, y: 200 }, // 1 thumb cmc
  { x: 55, y: 175 }, // 2 thumb mcp
  { x: 40, y: 150 }, // 3 thumb ip
  { x: 30, y: 128 }, // 4 thumb tip
  { x: 85, y: 150 }, // 5 index mcp
  { x: 80, y: 110 }, // 6 index pip
  { x: 77, y: 80 }, // 7 index dip
  { x: 75, y: 55 }, // 8 index tip
  { x: 110, y: 145 }, // 9 middle mcp
  { x: 108, y: 100 }, // 10 middle pip
  { x: 106, y: 65 }, // 11 middle dip
  { x: 105, y: 38 }, // 12 middle tip
  { x: 133, y: 150 }, // 13 ring mcp
  { x: 135, y: 105 }, // 14 ring pip
  { x: 137, y: 72 }, // 15 ring dip
  { x: 138, y: 48 }, // 16 ring tip
  { x: 155, y: 158 }, // 17 pinky mcp
  { x: 160, y: 120 }, // 18 pinky pip
  { x: 163, y: 95 }, // 19 pinky dip
  { x: 165, y: 75 }, // 20 pinky tip
];

export const BONE_CONNECTIONS: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [5, 9],
  [9, 13],
  [13, 17],
];

export const FINGER_JOINTS: Record<FingerName, { mcp: number; joints: [number, number, number] }> = {
  thumb: { mcp: 1, joints: [2, 3, 4] },
  index: { mcp: 5, joints: [6, 7, 8] },
  middle: { mcp: 9, joints: [10, 11, 12] },
  ring: { mcp: 13, joints: [14, 15, 16] },
  pinky: { mcp: 17, joints: [18, 19, 20] },
};

const OPEN_WORDS = ["extend", "point", "straight", "spread", "upward", "flat"];
const CLOSED_WORDS = ["fold", "curl", "closed", "tuck", "bent", "hook", "wrap"];

export function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) % 100000;
  }
  return hash;
}

export function lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

const PROXIMITY_LIMIT = 60;

/** Distance (in characters) from `fromIndex` to the closest occurrence of any of `words` in `text`. */
function nearestWordDistance(text: string, fromIndex: number, words: string[]): number {
  let minDistance = Infinity;
  for (const word of words) {
    let searchStart = 0;
    while (true) {
      const foundIndex = text.indexOf(word, searchStart);
      if (foundIndex === -1) break;
      minDistance = Math.min(minDistance, Math.abs(foundIndex - fromIndex));
      searchStart = foundIndex + 1;
    }
  }
  return minDistance;
}

/** Infers a 0 (extended) - 1 (curled) value for a finger from free-text ASL descriptions. */
export function curlFromDescription(description: string, fingerName: FingerName, isFistBase: boolean): number {
  const lower = description.toLowerCase();
  const mentionIndex = lower.indexOf(fingerName);

  if (mentionIndex !== -1) {
    // Use whichever keyword (open or closed) sits textually closest to this finger's
    // mention, rather than a fixed window — a wide window can pick up a keyword that
    // actually describes a different finger mentioned nearby in the same sentence.
    const openDistance = nearestWordDistance(lower, mentionIndex, OPEN_WORDS);
    const closedDistance = nearestWordDistance(lower, mentionIndex, CLOSED_WORDS);

    if (openDistance <= PROXIMITY_LIMIT && openDistance < closedDistance) return 0.05;
    if (closedDistance <= PROXIMITY_LIMIT && closedDistance < openDistance) return 0.9;
  }

  return isFistBase ? 0.85 : 0.1;
}

/** Returns a curl value (0-1) per finger, in FINGER_NAMES order, derived from a text description. */
export function curlProfileFromDescription(description: string): number[] {
  const lower = description.toLowerCase();
  const isFistBase = lower.includes("fist") || lower.includes("closed hand");
  return FINGER_NAMES.map((name) => curlFromDescription(lower, name, isFistBase));
}

/** Boolean "is this finger extended" profile, in FINGER_NAMES order. */
export function extendedProfileFromDescription(description: string): boolean[] {
  return curlProfileFromDescription(description).map((curl) => curl < 0.4);
}

interface LocationZone {
  keywords: string[];
  target: Point;
  scale: number;
}

const HAND_CENTROID: Point = BASE_LANDMARKS.reduce(
  (sum, point) => ({ x: sum.x + point.x / BASE_LANDMARKS.length, y: sum.y + point.y / BASE_LANDMARKS.length }),
  { x: 0, y: 0 },
);

// Many ASL signs share the same open-hand or fist shape and are only told
// apart by *where* they're made on/near the body (e.g. HELLO at the temple
// vs. THANK YOU at the chin). Finger curl alone can't distinguish these, so
// the whole hand is rescaled and repositioned into a distinct, well-separated
// body-relative zone of the frame as a visual cue — smaller and higher for
// signs made near the head, full-size and lower for signs made at the chest.
const LOCATION_ZONES: LocationZone[] = [
  { keywords: ["temple", "forehead", "ear", "head"], target: { x: 65, y: 65 }, scale: 0.75 },
  { keywords: ["chin", "mouth", "nose", "cheek"], target: { x: 118, y: 62 }, scale: 0.75 },
  { keywords: ["shoulder"], target: { x: 170, y: 70 }, scale: 0.75 },
  { keywords: ["chest", "torso"], target: { x: 118, y: 172 }, scale: 0.75 },
];

function locationZoneFromDescription(description?: string): LocationZone | null {
  if (!description) return null;
  const lower = description.toLowerCase();
  return LOCATION_ZONES.find((zone) => zone.keywords.some((keyword) => lower.includes(keyword))) ?? null;
}

export function buildSyntheticLandmarks(word: string, description?: string): Point[] {
  const seed = hashString(word);
  const landmarks = BASE_LANDMARKS.map((point) => ({ ...point }));
  const curls = description
    ? curlProfileFromDescription(description)
    : FINGER_NAMES.map((_, fingerIndex) => ((seed * (fingerIndex + 7) * 2654435761) % 1000) / 1000);

  FINGER_NAMES.forEach((name, fingerIndex) => {
    const { mcp, joints } = FINGER_JOINTS[name];
    const anchor = landmarks[mcp];
    const [pipIdx, dipIdx, tipIdx] = joints;
    const curl = curls[fingerIndex];
    landmarks[pipIdx] = lerp(BASE_LANDMARKS[pipIdx], anchor, curl * 0.35);
    landmarks[dipIdx] = lerp(BASE_LANDMARKS[dipIdx], anchor, curl * 0.6);
    landmarks[tipIdx] = lerp(BASE_LANDMARKS[tipIdx], anchor, curl * 0.8);
  });

  const zone = locationZoneFromDescription(description);
  if (zone) {
    return landmarks.map((point) => ({
      x: zone.target.x + (point.x - HAND_CENTROID.x) * zone.scale,
      y: zone.target.y + (point.y - HAND_CENTROID.y) * zone.scale,
    }));
  }

  return landmarks;
}
