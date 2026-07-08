import { CurriculumModule, Tier, VocabItem } from "./types";
import { Category, vocabularyByCategory } from "./vocabulary";

const alphabet: VocabItem[] = [
  {
    word: "A",
    type: "Letter",
    description:
      "Closed fist facing forward, with the thumb resting straight against the side of the index finger.",
    visualCue: "Closed fist cluster · thumb lateral contact",
  },
  {
    word: "B",
    type: "Letter",
    description:
      "Flat hand with four fingers extended and pressed together pointing up, thumb folded flat across the palm.",
    visualCue: "Flat plane · fingers unified, thumb tucked",
  },
  {
    word: "C",
    type: "Letter",
    description:
      "Hand curved into an open semi-circle, fingers and thumb both curved to mirror the shape of the letter C.",
    visualCue: "Curved arc · thumb-finger gap open",
  },
  {
    word: "D",
    type: "Letter",
    description:
      "Index finger points straight up, middle, ring, and pinky fingers curl to touch the thumb, forming a small circle at the base.",
    visualCue: "Single-point spire · base ring closed",
  },
  {
    word: "E",
    type: "Letter",
    description:
      "All four fingers curl downward to touch the thumb, forming a compact, claw-like closed shape.",
    visualCue: "Curled cluster · fingertip-thumb convergence",
  },
  {
    word: "F",
    type: "Letter",
    description:
      "Thumb and index finger touch to form a small circle, while the middle, ring, and pinky fingers extend upward.",
    visualCue: "Circular contact · thumb-index, tripod extended",
  },
  {
    word: "G",
    type: "Letter",
    description:
      "Index finger and thumb extend sideways, parallel to each other and to the ground, as if pinching a small object horizontally.",
    visualCue: "Horizontal pinch · lateral vector pair",
  },
  {
    word: "H",
    type: "Letter",
    description:
      "Index and middle fingers extend together sideways, parallel to the ground, with the remaining fingers folded down.",
    visualCue: "Parallel dual blade · lateral orientation",
  },
  {
    word: "I",
    type: "Letter",
    description:
      "Pinky finger extends straight up while the remaining fingers close into a fist, thumb resting across the palm.",
    visualCue: "Single-point spire · pinky isolated",
  },
  {
    word: "J",
    type: "Letter",
    description:
      "Pinky finger extends upward as in the letter I, and the hand traces the path of a letter J through the air.",
    visualCue: "Single-point spire · traced motion arc",
  },
  {
    word: "K",
    type: "Letter",
    description:
      "Index and middle fingers extend upward in a V, with the thumb touching between the two fingers at the middle knuckle.",
    visualCue: "V-split blades · thumb mid-contact",
  },
  {
    word: "L",
    type: "Letter",
    description:
      "Index finger points straight up and the thumb extends sideways, forming a right angle in the shape of the letter L.",
    visualCue: "Right-angle vector · index-thumb frame",
  },
  {
    word: "M",
    type: "Letter",
    description:
      "Thumb tucks underneath the index, middle, and ring fingers, which fold down over it, with the pinky resting on top.",
    visualCue: "Triple-fold stack · thumb buried",
  },
  {
    word: "N",
    type: "Letter",
    description:
      "Thumb tucks underneath the index and middle fingers, which fold down over it, while the ring and pinky fingers stay closed.",
    visualCue: "Double-fold stack · thumb buried",
  },
  {
    word: "O",
    type: "Letter",
    description:
      "Fingers and thumb curve inward to meet at their tips, forming a rounded circle shape like the letter O.",
    visualCue: "Closed ring · full-finger convergence",
  },
  {
    word: "P",
    type: "Letter",
    description:
      "Similar to K, but the hand tilts downward so the middle finger points toward the floor, with the thumb touching between the index and middle fingers.",
    visualCue: "V-split blades · downward tilt vector",
  },
  {
    word: "Q",
    type: "Letter",
    description:
      "Similar to G, but the hand tilts downward, with the thumb and index finger pinched and pointing toward the floor.",
    visualCue: "Downward pinch · lateral vector, tilted",
  },
  {
    word: "R",
    type: "Letter",
    description:
      "Index and middle fingers cross over each other while extended upward, with the remaining fingers folded down.",
    visualCue: "Crossed dual blade · vertical orientation",
  },
  {
    word: "S",
    type: "Letter",
    description:
      "Closed fist with the thumb wrapped across the front of the fingers, rather than at the side.",
    visualCue: "Closed fist cluster · thumb frontal wrap",
  },
  {
    word: "T",
    type: "Letter",
    description:
      "Closed fist with the thumb tucked between the index and middle fingers, tip peeking through slightly.",
    visualCue: "Closed fist cluster · thumb interstitial",
  },
  {
    word: "U",
    type: "Letter",
    description:
      "Index and middle fingers extend straight upward together, held closely side by side, remaining fingers folded down.",
    visualCue: "Parallel dual blade · vertical orientation",
  },
  {
    word: "V",
    type: "Letter",
    description:
      "Index and middle fingers extend upward and spread apart to form a V shape, remaining fingers folded down.",
    visualCue: "V-split blades · wide vertical spread",
  },
  {
    word: "W",
    type: "Letter",
    description:
      "Index, middle, and ring fingers extend upward and spread apart, while the thumb holds the pinky finger down.",
    visualCue: "Tri-split blades · pinky anchor point",
  },
  {
    word: "X",
    type: "Letter",
    description:
      "Index finger bends at the middle knuckle into a hook shape, while the remaining fingers close into a fist.",
    visualCue: "Hook curl · single-joint flex",
  },
  {
    word: "Y",
    type: "Letter",
    description:
      "Thumb and pinky finger extend outward from a closed fist, while the middle three fingers stay folded down.",
    visualCue: "Outer-span vector · thumb-pinky extension",
  },
  {
    word: "Z",
    type: "Letter",
    description:
      "Index finger extends forward and traces the path of the letter Z through the air.",
    visualCue: "Single-point spire · traced angular path",
  },
];

// Note: deliberately not named "module" — that would shadow webpack's CommonJS
// `module` object and crash the dev-mode React Refresh runtime.
function buildModule(id: string, title: string, summary: string, category: Category): CurriculumModule {
  return { id, title, summary, items: vocabularyByCategory(category) };
}

export const curriculumData: Record<Tier, CurriculumModule[]> = {
  beginner: [
    {
      id: "alphabet",
      title: "The Manual Alphabet",
      summary: "Master all 26 handshapes of ASL fingerspelling, A through Z.",
      items: alphabet,
    },
    buildModule("numbers", "Numbers 1–10", "Count on one hand, the ASL way.", "Numbers"),
    buildModule("greetings", "Greetings & Politeness", "Start every conversation with warmth.", "Greetings & Politeness"),
    buildModule("family", "Family & People", "Talk about the people in your life.", "Family & People"),
    buildModule("pronouns", "Pronouns", "Point precisely: me, you, us, them.", "Pronouns"),
    buildModule("responses", "Yes, No & Responses", "Answer naturally in conversation.", "Responses"),
  ],
  intermediate: [
    buildModule("actions", "Everyday Actions", "The verbs you'll use constantly.", "Everyday Actions"),
    buildModule("feelings", "Feelings & Emotions", "Show how you feel with expressive signs.", "Feelings"),
    buildModule("food", "Food & Drink", "Order, cook, and talk about meals.", "Food & Drink"),
    buildModule("questions", "Question Words", "Ask who, what, where, when, why, and how.", "Questions"),
    buildModule("time", "Time & Days", "Talk about today, tomorrow, and beyond.", "Time"),
  ],
  advanced: [
    buildModule("places", "Places & Going Out", "Navigate the world around you.", "Places"),
    buildModule("descriptors", "Describing Words", "Add color and detail to your signing.", "Describing Words"),
    buildModule("colors", "Colors", "The full palette, one handshape at a time.", "Colors"),
    buildModule("household", "Around the House", "Objects and things you use daily.", "Around the House"),
    buildModule("nature", "Nature & Animals", "Weather, plants, and pets.", "Nature & Animals"),
    buildModule("phrases", "Conversational Phrases", "Chain signs into full, natural sentences.", "Phrases"),
  ],
};

export const tierLabels: Record<Tier, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};
