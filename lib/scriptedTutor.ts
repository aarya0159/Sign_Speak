import { curriculumData } from "@/lib/curriculumData";
import { WORD_SIGNS } from "@/lib/wordSigns";

export interface TutorContext {
  streak: number;
  studiedThisWeek: number;
  lessonsCompleted: number;
  missedLetters: string[];
}

function findLetterDescription(letter: string): string | null {
  const alphabet = curriculumData.beginner.find((module) => module.id === "alphabet")?.items ?? [];
  const match = alphabet.find((item) => item.word.toUpperCase() === letter.toUpperCase());
  return match?.description ?? null;
}

/**
 * A fully local, rule-based tutor — no API calls, just pattern-matched replies
 * over the user's real stats and curriculum data. Serves as the offline
 * fallback behind the LLM-backed /api/tutor route.
 */
export function generateScriptedReply(message: string, context: TutorContext): string {
  const lower = message.toLowerCase().trim();

  // Conversational intents run first, so "what should I study next?" isn't
  // hijacked by the sign lookup matching the word WHAT.
  if (/(streak|how am i doing|my progress)/.test(lower)) {
    if (context.streak === 0) {
      return `You don't have an active streak yet — complete a lesson today to start one. You've finished ${context.lessonsCompleted} lesson(s) so far, so you've got a foundation to build on.`;
    }
    return `You're on a ${context.streak}-day streak and studied ${context.studiedThisWeek} day(s) this week, with ${context.lessonsCompleted} lesson(s) completed. Keep it going!`;
  }

  if (/(what should i study|what.?s next|what next|recommend|suggest)/.test(lower)) {
    if (context.missedLetters.length > 0) {
      return `Based on your recent quizzes, you've missed ${context.missedLetters.slice(-3).join(", ")}. I'd drill those next — open Lessons and study them again, then retake the Daily Quiz.`;
    }
    return "You're off to a solid start. Try the Greetings & Politeness module next, or take a Daily Quiz to check your retention.";
  }

  if (/(missed|wrong|struggl|weak)/.test(lower)) {
    if (context.missedLetters.length > 0) {
      return `You've recently gotten these wrong in quizzes: ${context.missedLetters.join(", ")}. Ask me "how do I sign [word or letter]" and I'll walk you through any of them.`;
    }
    return "You haven't missed anything in your recent quizzes — nice work! Take a Daily Quiz any time to keep testing yourself.";
  }

  if (/^(hi|hey|hello|yo|sup)[\s!.?]*$/.test(lower)) {
    return 'Hey! Try asking me things like "what should I study next?", "how do I sign thank you?", or "how\'s my streak?".';
  }

  const letterMatch =
    lower.match(/\bletter\s+([a-z])\b/) || lower.match(/\bsign\s+(?:the\s+)?(?:letter\s+)?([a-z])\b/) || lower.match(/^([a-z])$/);
  if (letterMatch) {
    const letter = letterMatch[1].toUpperCase();
    const description = findLetterDescription(letter);
    if (description) {
      return `Here's how to sign the letter ${letter}: ${description}`;
    }
  }

  // Prefer the longest matching sign so "thank-you" beats "you", and require
  // word boundaries so "sad" doesn't match inside "Tuesday".
  const normalized = lower.replace(/[-_]/g, " ");
  const signMatches = Object.values(WORD_SIGNS)
    .filter((entry) => {
      const word = entry.word.toLowerCase().replace(/[-_]/g, " ");
      return new RegExp(`(^|[^a-z])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z])`).test(normalized);
    })
    .sort((a, b) => b.word.length - a.word.length);

  if (signMatches.length > 0) {
    const entry = signMatches[0];
    return `To sign "${entry.word}": ${entry.description}`;
  }

  return 'I can help with your ASL progress. Try asking about your streak, which signs you\'ve missed, or how to sign a specific word — like "how do I sign please?".';
}
