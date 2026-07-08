"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const name = firstName.trim() || "Learner";
    const cleanEmail = email.trim().toLowerCase();

    if (password.length < 6) {
      setError("Your password needs at least 6 characters.");
      return;
    }

    // Local-only demo auth: if this email signed up before on this device,
    // the password must match; otherwise this creates the account.
    const storedEmail = localStorage.getItem("signspeak_user_email");
    const storedPassword = localStorage.getItem("signspeak_user_password");
    if (storedEmail === cleanEmail && storedPassword && storedPassword !== password) {
      setError("That password doesn't match this account. Try again.");
      return;
    }

    localStorage.setItem("signspeak_user_name", name);
    localStorage.setItem("signspeak_user_email", cleanEmail);
    localStorage.setItem("signspeak_user_password", password);
    router.push("/home");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="pointer-events-none fixed -left-24 top-10 h-72 w-72 rounded-full bg-peach/70 blur-3xl animate-float" />
      <div className="pointer-events-none fixed -right-16 bottom-16 h-80 w-80 rounded-full bg-honey/20 blur-3xl animate-drift" />

      <div className="card-warm animate-fade-up relative w-full max-w-md p-8">
        <Link href="/" className="mb-8 flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-gradient-to-br from-coral to-honey" />
          <h1 className="text-2xl font-extrabold tracking-tight">SignSpeak AI</h1>
        </Link>

        <h2 className="mb-1 text-lg font-bold">Welcome back</h2>
        <p className="mb-6 text-sm text-muted">
          Sign in — or create your account — to continue your sign language journey.
        </p>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-bold text-espresso/80">First name</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Jordan"
              className="w-full rounded-full border border-espresso/10 bg-white px-5 py-3 text-sm outline-none focus:border-coral focus:shadow-warm-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-espresso/80">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-full border border-espresso/10 bg-white px-5 py-3 text-sm outline-none focus:border-coral focus:shadow-warm-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-espresso/80">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-full border border-espresso/10 bg-white px-5 py-3 text-sm outline-none focus:border-coral focus:shadow-warm-sm"
            />
          </div>

          {error && (
            <p className="rounded-2xl border border-rose/30 bg-rose/10 px-4 py-2.5 text-sm font-medium text-rose">
              {error}
            </p>
          )}

          <button type="submit" className="btn-sunset mt-2 w-full py-3 text-sm">
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          New here? The same form creates your account.
        </p>
      </div>
    </main>
  );
}
