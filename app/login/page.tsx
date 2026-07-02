"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");

  function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    const name = firstName.trim() || "Learner";
    localStorage.setItem("signspeak_user_name", name);
    localStorage.setItem("signspeak_user_email", email.trim());
    router.push("/home");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6">
      <div className="w-full max-w-md rounded-3xl border border-espresso/10 bg-white/70 p-8 backdrop-blur-md shadow-sm">
        <div className="mb-8 flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-purple" />
          <h1 className="text-2xl font-bold tracking-tight">SignSpeak AI</h1>
        </div>

        <h2 className="mb-1 text-lg font-bold">Welcome back</h2>
        <p className="mb-6 text-sm text-muted">
          Sign in to continue your sign language journey.
        </p>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-bold text-espresso/80">
              First name
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Jordan"
              className="w-full rounded-2xl border border-espresso/10 bg-white px-4 py-3 text-sm outline-none focus:border-purple"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-espresso/80">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-espresso/10 bg-white px-4 py-3 text-sm outline-none focus:border-purple"
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-2xl bg-purple py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          Create account · Sign in
        </p>
      </div>
    </main>
  );
}
