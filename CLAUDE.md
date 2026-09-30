# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start Next.js dev server (localhost:3000)
npm run build    # production build (also type-checks + lints)
npm run start    # serve the production build
npm run lint     # next lint only
```

There is no test suite configured. There is no single-test command.

### Android (Capacitor)

The site is also shipped to the Play Store as a Capacitor-wrapped native shell that loads the deployed URL (configured in `capacitor.config.ts`, currently `https://sign-speak-sigma.vercel.app/`) rather than bundling the Next.js app locally — this is required because `app/api/tutor` is a server route that a static export can't serve.

```bash
npx cap sync android                        # re-copy web assets/config into android/ after changing capacitor.config.ts
cd android && ./gradlew assembleDebug        # debug APK -> android/app/build/outputs/apk/debug/
cd android && ./gradlew bundleRelease        # signed release AAB -> android/app/build/outputs/bundle/release/ (for Play Store upload)
```

Release signing reads `android/keystore.properties` (gitignored, not committed — holds the keystore path/passwords). The Gradle build requires JDK 21 (`android/gradle.properties` pins `org.gradle.java.home`); if that path doesn't exist on a new machine, install a JDK 21 and update it.

Icon/splash source of truth is `store-assets/image.png` (also mirrored to `public/logo.png` for in-site use and `app/icon.png` for the Next.js favicon). Regenerating all Android densities + the Play Store listing icon/feature graphic from that one source is a Python/Pillow script (not currently checked into the repo) — recrop/rescale into `android/app/src/main/res/mipmap-*/ic_launcher*.png`, `drawable*/splash.png`, and `store-assets/play-store-icon-512.png` if the logo changes.

## Architecture

This is a Next.js 14 App Router app. There is no database and no real backend auth — "accounts" are a `localStorage`-only demo (`signspeak_user_*` keys in `app/login/page.tsx`), and progress stats (`signspeak_stats`, `signspeak_missed_letters`, `signspeak_completed_modules`) live client-side too. Treat anything under `localStorage` as per-device demo state, not a source of truth to persist elsewhere.

The four authenticated screens (`app/home`, `app/lessons`, `app/tutor`) all render the same `components/Sidebar.tsx` next to a `TabKey`-driven content area — `app/home/page.tsx` in particular multiplexes `dashboard | text-to-sign | sign-to-text | dictionary` through `components/HomeTabs.tsx` and `SignToTextTab.tsx` based on a `TabKey` (`lib/types.ts`), with the active tab mirrored into the `?tab=` query param.

### Sign data pipeline (`lib/`)

Everything about *what a sign looks like* funnels through a small set of files, in this dependency order:

1. **`lib/handShapes.ts`** — the core sign vocabulary primitives: `HAND_SHAPES`/`LETTER_CURLS` (finger curl presets), `LOCATIONS`, `MotionKey`, and `SignStep`/`AnimFrame`. `framesForItem()` turns a `VocabItem`'s `steps` into animation frames; `poseStreamAt()` interpolates a continuous pose across chained frames (this is what drives the animated hand in Text→Sign).
2. **`lib/vocabulary.ts`** — the actual ASL vocabulary (`VOCABULARY`, categorized by `Category`), each entry a `VocabItem` with a structured `steps` sequence where available. `lib/wordSigns.ts` is a thin compatibility adapter (`WORD_SIGNS` keyed by uppercase word) over this.
3. **`lib/curriculumData.ts`** — organizes `VOCABULARY` into `curriculumData.beginner/intermediate/advanced` modules (`CurriculumModule`) for the Lessons flow, including the fingerspelling alphabet.
4. **`lib/handPose.ts`** — the shared 21-point MediaPipe hand-landmark topology (`BASE_LANDMARKS`, `BONE_CONNECTIONS`, `FINGER_JOINTS`) used by both synthetic (animated) and camera-tracked hands, plus `buildSyntheticLandmarks()` which derives a pose from a free-text sign description (used as a fallback when a `VocabItem` has no structured `steps`).
5. **`components/HandVisionPanel.tsx`** — the shared skeleton-rendering SVG component; it either samples `poseStreamAt()` (animated playback) or renders `liveLandmarks` directly (real camera feed) — same rendering path for both.

### Sign→Text camera recognition (gloss-free, streaming)

`components/SignToTextTab.tsx` runs a `requestAnimationFrame` loop (throttled to `DETECTION_INTERVAL_MS`) that: reads a video frame → MediaPipe `HandLandmarker.detectForVideo()` → `lib/signRecognizer.ts` scores the landmarks against every known sign/letter every frame (`scoreCandidates()`, combining handshape match, wrist location, and `classifyMotion()`'s window-based motion classification) → the ranked candidates feed `lib/glossFreeDecoder.ts`'s `GlossFreeDecoder`, which maintains an EMA belief per candidate word and "commits" a word into the output sentence once its belief sustains long enough (rather than requiring the user to freeze in a pose per word). This scorer is explicitly a geometric stand-in — the code comments call out that a trained sequence encoder (ViT + CTC) is meant to drop in behind the same `Candidate`-array interface without changing the decoder or UI.

### AI Tutor

`app/api/tutor/route.ts` is a Next.js server route (`runtime = "nodejs"`) that calls the Anthropic API (`@anthropic-ai/sdk`) with a system prompt scoped strictly to ASL/Deaf-culture topics and the learner's live stats. If `ANTHROPIC_API_KEY` is unset, or the API call fails for any reason, it transparently falls back to `lib/scriptedTutor.ts`'s `generateScriptedReply()` — a fully local, regex-pattern-matched responder over the same curriculum/vocabulary data — so the tutor UI never surfaces a hard error. The response includes `source: "llm" | "offline"`.

### Styling

Tailwind with a warm custom palette defined in `tailwind.config.ts` (`cream`, `espresso`, `coral`, `peach`, `apricot`, `honey`, `rose`, `muted`) plus reusable component classes (`card-warm`, `btn-sunset`, `chip-warm`, etc.) defined in `app/globals.css` — prefer those existing classes over one-off utility soup when styling new UI in this app.
