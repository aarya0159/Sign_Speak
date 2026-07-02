import { CurriculumModule, Tier, VocabItem } from "./types";

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

const greetings: VocabItem[] = [
  {
    word: "Hi / Hello",
    type: "Greeting",
    description:
      "Open hand near the temple, palm facing forward, moves outward and slightly downward in a small arc, similar to a relaxed salute.",
    visualCue: "Open palm plane · outward temple arc",
  },
  {
    word: "Thank You",
    type: "Greeting",
    description:
      "Flat hand touches the chin with the fingertips, palm facing inward, then moves forward and down toward the person being thanked.",
    visualCue: "Flat palm plane · chin-to-forward path",
  },
];

const emotions: VocabItem[] = [
  {
    word: "Fantastic / Wonderful",
    type: "Emotion",
    description:
      "Both open hands, palms facing forward near the shoulders, push upward and outward simultaneously with a brief shake, as if radiating excitement outward.",
    visualCue: "Dual open palms · symmetric upward burst",
  },
  {
    word: "Excited",
    type: "Emotion",
    description:
      "Both open hands alternate in small upward circular tracking movements near the torso, one rising as the other dips, mirroring rising energy.",
    visualCue: "Alternating dual palms · upward circular torso track",
  },
];

const phrases: VocabItem[] = [
  {
    word: "Nice to meet you.",
    type: "Phrase",
    description:
      "A three-part sign chain: NICE (a flat hand slides forward across the open palm of the other hand), then MEET (two upright index fingers move toward each other until they touch), then YOU (index finger points toward the other person).",
    visualCue: "Sequential 3-node chain · slide, converge, point",
  },
  {
    word: "Can you help me?",
    type: "Phrase",
    description:
      "A four-part sign chain: CAN (both fists drop down firmly together), HELP (one flat hand lifts the other closed fist upward from beneath), YOU (index finger points outward), and ME (index finger points back to the chest), accompanied by raised eyebrows to indicate a question.",
    visualCue: "Sequential 4-node chain · drop, lift, point, point",
  },
];

export const curriculumData: Record<Tier, CurriculumModule[]> = {
  beginner: [
    {
      id: "alphabet",
      title: "The Manual Alphabet",
      summary: "Master all 26 handshapes of ASL fingerspelling, A through Z.",
      items: alphabet,
    },
    {
      id: "greetings",
      title: "Essential Greetings",
      summary: "Start every conversation with confidence.",
      items: greetings,
    },
  ],
  intermediate: [
    {
      id: "emotions",
      title: "Expressing Emotions",
      summary: "Show how you feel with expressive, dynamic signs.",
      items: emotions,
    },
  ],
  advanced: [
    {
      id: "phrases",
      title: "Conversational Phrases",
      summary: "Chain multiple signs together into full, natural sentences.",
      items: phrases,
    },
  ],
};

export const tierLabels: Record<Tier, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};
