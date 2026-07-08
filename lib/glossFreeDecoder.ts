import type { Candidate } from "./signRecognizer";

/**
 * Gloss-free streaming decoder.
 *
 * Instead of treating signs as isolated flashcards (gloss tokens) that get
 * "committed" one frozen word at a time, this decoder consumes the ranked
 * per-frame hypothesis emissions from the landmark-sequence scorer and
 * maintains a continuously evolving belief state (exponential moving average
 * per candidate — a lightweight stand-in for CTC-style sequence decoding).
 * The UI receives, every frame:
 *   - the committed sentence so far,
 *   - the live (uncommitted) hypothesis currently being formed,
 *   - the full ranked prediction array with confidences, for streaming display.
 *
 * A trained end-to-end encoder (ViT over raw landmark sequences + CTC loss)
 * would replace the geometric scorer upstream; this decoding interface stays
 * the same.
 */

export interface StreamPrediction {
  word: string;
  confidence: number;
  isScriptedWord: boolean;
}

export interface DecoderState {
  /** Sentence assembled so far (words space-separated, fingerspelling contiguous). */
  committedText: string;
  /** The hypothesis currently strengthening but not yet committed. */
  hypothesis: StreamPrediction | null;
  /** Ranked live prediction array for the streaming confidence display. */
  predictions: StreamPrediction[];
}

const EMA_DECAY = 0.8;
const EMA_LEARN = 0.35;
const HYPOTHESIS_THRESHOLD = 0.42;
const COMMIT_FRAMES = 6;
const REPEAT_COOLDOWN_FRAMES = 10;

export class GlossFreeDecoder {
  private beliefs = new Map<string, { ema: number; candidate: Candidate }>();
  private committedWords: string[] = [];
  private hypothesisWord: string | null = null;
  private hypothesisStreak = 0;
  private framesSinceCommit = Infinity;
  private lastCommittedWord: string | null = null;

  /** Feed one frame of ranked candidates; returns the current stream state. */
  update(candidates: Candidate[]): DecoderState {
    this.framesSinceCommit += 1;

    // Decay all beliefs, then blend in this frame's evidence
    for (const belief of this.beliefs.values()) {
      belief.ema *= EMA_DECAY;
    }
    for (const candidate of candidates) {
      const existing = this.beliefs.get(candidate.word);
      if (existing) {
        existing.ema += candidate.confidence * EMA_LEARN;
        existing.candidate = candidate;
      } else {
        this.beliefs.set(candidate.word, { ema: candidate.confidence * EMA_LEARN, candidate });
      }
    }

    const ranked = [...this.beliefs.entries()]
      .map(([word, { ema, candidate }]) => ({
        word,
        confidence: Math.min(1, ema),
        isScriptedWord: candidate.isScriptedWord,
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    const top = ranked[0];
    let hypothesis: StreamPrediction | null = null;

    if (top && top.confidence >= HYPOTHESIS_THRESHOLD) {
      hypothesis = top;
      if (this.hypothesisWord === top.word) {
        this.hypothesisStreak += 1;
      } else {
        this.hypothesisWord = top.word;
        this.hypothesisStreak = 1;
      }

      const isRepeat =
        top.word === this.lastCommittedWord && this.framesSinceCommit < REPEAT_COOLDOWN_FRAMES;

      if (this.hypothesisStreak >= COMMIT_FRAMES && !isRepeat) {
        this.commit(top);
        hypothesis = null;
      }
    } else {
      this.hypothesisWord = null;
      this.hypothesisStreak = 0;
    }

    return {
      committedText: this.renderCommitted(),
      hypothesis,
      predictions: ranked,
    };
  }

  /** Call when the hand leaves the frame — softens beliefs without wiping the sentence. */
  handLost(): DecoderState {
    for (const belief of this.beliefs.values()) belief.ema *= 0.5;
    this.hypothesisWord = null;
    this.hypothesisStreak = 0;
    this.lastCommittedWord = null;
    return { committedText: this.renderCommitted(), hypothesis: null, predictions: [] };
  }

  clear(): DecoderState {
    this.beliefs.clear();
    this.committedWords = [];
    this.hypothesisWord = null;
    this.hypothesisStreak = 0;
    this.lastCommittedWord = null;
    this.framesSinceCommit = Infinity;
    return { committedText: "", hypothesis: null, predictions: [] };
  }

  private commit(prediction: StreamPrediction) {
    this.committedWords.push(prediction.word);
    this.lastCommittedWord = prediction.word;
    this.framesSinceCommit = 0;
    this.hypothesisWord = null;
    this.hypothesisStreak = 0;
    // Suppress the just-committed belief so the next sign can rise cleanly
    for (const belief of this.beliefs.values()) belief.ema *= 0.25;
  }

  private renderCommitted(): string {
    // Single letters flow together (fingerspelling); words get spaces
    let out = "";
    let prevWasLetter = false;
    for (const word of this.committedWords) {
      const isLetter = word.length === 1;
      if (out.length === 0) out = word;
      else if (isLetter && prevWasLetter) out += word;
      else out += ` ${word}`;
      prevWasLetter = isLetter;
    }
    return out;
  }
}
