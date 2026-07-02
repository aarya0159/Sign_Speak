import Link from "next/link";
import HandVisionPanel from "@/components/HandVisionPanel";

const FEATURES = [
  {
    title: "Text → Sign",
    description: "Type or speak any word and watch it break down into fingerspelled handshapes.",
  },
  {
    title: "Sign → Text",
    description: "Your camera reads hand shapes in real time and turns them into text and speech.",
  },
  {
    title: "Guided Lessons",
    description: "Work through beginner-to-advanced tiers with flashcards and adaptive quizzes.",
  },
];

const STATS = [
  { value: "70M+", label: "Deaf people worldwide use sign language as their first language" },
  { value: "300+", label: "Distinct sign languages are in use across the globe" },
  { value: "26", label: "Handshapes to master before you're fully fingerspelling" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-cream">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-purple" aria-hidden="true" />
          <span className="text-lg font-extrabold tracking-tight text-espresso">SignSpeak AI</span>
        </div>
        <Link
          href="/login"
          className="rounded-2xl border border-espresso/10 bg-white/70 px-5 py-2 text-sm font-bold text-espresso backdrop-blur-md transition hover:bg-white"
        >
          Log In
        </Link>
      </header>

      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-12 lg:grid-cols-2 lg:py-20">
        <div className="space-y-6">
          <span className="inline-block rounded-full bg-purple-soft px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-purple">
            Learn American Sign Language
          </span>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-espresso sm:text-5xl">
            Learn to sign. Understand everyone.
          </h1>
          <p className="text-lg text-muted">
            Over 70 million Deaf people around the world communicate primarily through sign
            language. SignSpeak AI uses live hand tracking and guided lessons to help you learn to
            meet them halfway — one handshape at a time.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/login"
              className="rounded-2xl bg-purple px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
            >
              Get Started →
            </Link>
            <Link href="/login" className="text-sm font-bold text-espresso/70 hover:text-espresso">
              Already have an account? Sign in
            </Link>
          </div>
        </div>

        <HandVisionPanel word="HELLO" visualCue='Live preview of the tracking engine' index={0} total={1} />
      </section>

      <section className="border-y border-espresso/10 bg-white/50">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-12 sm:grid-cols-3">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center sm:text-left">
              <p className="text-4xl font-extrabold text-purple">{stat.value}</p>
              <p className="mt-1 text-sm text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="mb-8 text-center text-2xl font-extrabold tracking-tight text-espresso">
          Everything you need to start signing
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-espresso/10 bg-white/70 p-6 backdrop-blur-md"
            >
              <h3 className="text-lg font-extrabold text-espresso">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-3xl border border-espresso/10 bg-purple px-8 py-12 text-center text-white">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Ready to start signing?</h2>
          <p className="mx-auto mt-2 max-w-xl text-purple-soft/90">
            Create your free account and finish your first lesson in the next five minutes.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-2xl bg-white px-6 py-3 text-sm font-bold text-purple shadow-sm transition hover:opacity-90"
          >
            Get Started →
          </Link>
        </div>
      </section>

      <footer className="border-t border-espresso/10 px-6 py-8 text-center text-xs text-muted">
        SignSpeak AI · Learn sign language with live AI hand tracking
      </footer>
    </main>
  );
}
