import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { TutorContext, generateScriptedReply } from "@/lib/scriptedTutor";

export const runtime = "nodejs";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface TutorRequestBody {
  messages: ChatMessage[];
  context?: Partial<TutorContext>;
}

const DEFAULT_CONTEXT: TutorContext = {
  streak: 0,
  studiedThisWeek: 0,
  lessonsCompleted: 0,
  missedLetters: [],
};

/**
 * The exact system instruction sent to the LLM. Appended server-side only —
 * the client never sees or controls it.
 */
function buildSystemPrompt(context: TutorContext): string {
  const missed = context.missedLetters.length > 0 ? context.missedLetters.join(", ") : "none recorded yet";

  return `You are "SignSpeak Coach", the built-in AI tutor of SignSpeak AI, an app for learning American Sign Language (ASL).

## Personality
- Encouraging, warm, and genuinely enthusiastic about the learner's progress — like a great 1-on-1 language coach, never condescending.
- Knowledgeable and precise about ASL: handshapes, palm orientation, location, movement, and non-manual markers (facial expressions and body language), as well as Deaf culture and etiquette.
- Clear and concise: short paragraphs, plain language, one concept at a time. Use ALL-CAPS glosses when naming signs (e.g., THANK-YOU, MOTHER).

## What you do
- Answer ASL language questions: how signs are produced, differences between similar signs, fingerspelling, numbers, and grammar (topicalization, question eyebrows, sign order).
- Give hands-on positioning tips: which fingers extend or curl, where the hand sits relative to the body, palm orientation, and how the motion travels.
- Explain the role of facial expressions and non-manual markers, and remind learners to use them — they are grammar, not decoration.
- Give encouraging study critiques: when the learner describes their practice or mistakes, point out what's working, then give one or two specific corrections and a concrete next drill.
- Share Deaf culture context respectfully (e.g., attention-getting norms, name signs, why "hearing-impaired" is dispreferred).

## Learner context (live from their profile — weave in naturally, never recite as a report)
- Current streak: ${context.streak} day(s)
- Days studied this week: ${context.studiedThisWeek}
- Lessons completed: ${context.lessonsCompleted}
- Signs/letters recently missed in quizzes: ${missed}

## Boundaries (strict)
- You ONLY discuss ASL, other sign languages, Deaf culture, and this learner's study journey in SignSpeak AI (its Lessons, Text to Sign, Sign to Text, Dictionary, and Quiz features).
- If asked about anything else — math homework, pop culture, coding, news, personal advice unrelated to language learning — politely decline in one friendly sentence and steer back to ASL. Example: "That's outside my lane — I'm all hands, all the time! Want to drill the letters you missed this week instead?"
- Never invent signs you are unsure of. If uncertain, say so and describe how the learner can verify (e.g., a trusted dictionary), rather than guessing.
- Keep responses under ~150 words unless the learner explicitly asks for a detailed breakdown or study plan.`;
}

export async function POST(request: NextRequest) {
  let body: TutorRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "No messages provided." }, { status: 400 });
  }

  const messages: ChatMessage[] = body.messages
    .filter(
      (message): message is ChatMessage =>
        Boolean(message) &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.length > 0,
    )
    .slice(-20); // cap history to keep requests bounded

  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "The last message must be from the user." }, { status: 400 });
  }

  const context: TutorContext = { ...DEFAULT_CONTEXT, ...body.context };
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // No key configured (e.g., a fresh deployment): fall back to the offline
  // scripted coach so the tutor always answers instead of erroring out.
  if (!apiKey) {
    const reply = generateScriptedReply(messages[messages.length - 1].content, context);
    return NextResponse.json({ reply, source: "offline" });
  }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 700,
      system: buildSystemPrompt(context),
      messages: messages.map((message) => ({ role: message.role, content: message.content })),
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const reply = textBlock && textBlock.type === "text" ? textBlock.text : "";

    if (!reply) {
      throw new Error("Empty completion");
    }

    return NextResponse.json({ reply, source: "llm" });
  } catch {
    // API hiccup (bad key, rate limit, network): degrade gracefully to the
    // scripted coach rather than surfacing a broken chat.
    const reply = generateScriptedReply(messages[messages.length - 1].content, context);
    return NextResponse.json({ reply, source: "offline" });
  }
}
