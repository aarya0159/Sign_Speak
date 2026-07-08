"use client";

import Link from "next/link";
import HandVisionPanel from "@/components/HandVisionPanel";
import { framesForItem } from "@/lib/handShapes";
import { findVocabSign } from "@/lib/vocabulary";

const FEATURES = [
  {
    icon: "⌨️",
    title: "Text → Sign",
    description: "Type or speak a sentence and watch an animated hand sign it — real ASL signs for known words, fingerspelling for names.",
  },
  {
    icon: "📷",
    title: "Sign → Text",
    description: "Your camera tracks 21 hand landmarks plus movement patterns in real time and turns your signs into text and speech.",
  },
  {
    icon: "📚",
    title: "Guided Lessons",
    description: "Almost 200 everyday signs across 17 themed modules, from the alphabet to full conversational phrases.",
  },
];

const STATS = [
  { value: "70M+", label: "Deaf people worldwide use sign language as their first language" },
  { value: "300+", label: "Distinct sign languages are in use across the globe" },
  { value: "200+", label: "Common signs and letters ready to learn inside SignSpeak" },
];

export default function LandingPage() {
  const helloFrames = framesForItem(findVocabSign("Hello")!);

  return (
    <main className="min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed -left-32 top-0 h-96 w-96 rounded-full bg-peach/60 blur-3xl animate-float" />
      <div className="pointer-events-none fixed -right-24 top-40 h-80 w-80 rounded-full bg-honey/20 blur-3xl animate-drift" />
      <div className="pointer-events-none fixed bottom-0 left-1/3 h-72 w-72 rounded-full bg-rose/10 blur-3xl animate-float" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-gradient-to-br from-coral to-honey" aria-hidden="true" />
          <span className="text-lg font-extrabold tracking-tight text-espresso">SignSpeak AI</span>
        </div>
        <Link
          href="/login"
          className="rounded-full border border-espresso/10 bg-white/70 px-5 py-2 text-sm font-bold text-espresso backdrop-blur-md hover:border-coral/40 hover:text-coral"
        >
          Log In
        </Link>
      </header>

      <section className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-12 lg:grid-cols-2 lg:py-20">
        <div className="animate-fade-up space-y-6">
          <span className="chip-warm inline-block px-4 py-1.5 uppercase tracking-wide">
            Learn American Sign Language
          </span>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-espresso sm:text-6xl">
            Learn to sign.
            <br />
            <span className="text-sunset">Understand everyone.</span>
          </h1>
          <p className="max-w-xl text-lg text-muted">
            Over 70 million Deaf people around the world communicate primarily through sign
            language. SignSpeak AI uses live hand tracking, animated signing, and guided lessons to
            help you meet them halfway — one handshape at a time.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/login" className="btn-sunset px-7 py-3.5 text-sm">
              Get Started →
            </Link>
            <Link href="/login" className="text-sm font-bold text-espresso/70 hover:text-coral">
              Already have an account? Sign in
            </Link>
          </div>
        </div>

        <div className="animate-fade-up [animation-delay:150ms]">
          <HandVisionPanel label="Hello" frames={helloFrames} visualCue="Live preview · animated ASL playback" />
        </div>
      </section>

      <section className="relative border-y border-espresso/10 bg-white/40 backdrop-blur-sm">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-12 sm:grid-cols-3">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center sm:text-left">
              <p className="text-sunset text-4xl font-extrabold">{stat.value}</p>
              <p className="mt-1 text-sm text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 py-16">
        <h2 className="mb-8 text-center text-2xl font-extrabold tracking-tight text-espresso sm:text-3xl">
          Everything you need to <span className="text-sunset">start signing</span>
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="card-warm card-warm-hover p-6">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-peach to-apricot/40 text-xl">
                <span aria-hidden="true">{feature.icon}</span>
              </div>
              <h3 className="text-lg font-extrabold text-espresso">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 pb-20">
        <div className="overflow-hidden rounded-4xl bg-gradient-to-br from-coral via-coral-deep to-rose px-8 py-14 text-center text-white shadow-warm">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Ready to start signing?</h2>
          <p className="mx-auto mt-2 max-w-xl text-peach/90">
            Create your free account and finish your first lesson in the next five minutes.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-full bg-white px-7 py-3.5 text-sm font-bold text-coral-deep shadow-sm hover:scale-[1.03]"
          >
            Get Started →
          </Link>
        </div>
      </section>

      <footer className="relative border-t border-espresso/10 px-6 py-8 text-center text-xs text-muted">
        SignSpeak AI · Learn sign language with live AI hand tracking
      </footer>
    </main>
  );
}
