"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong. Try again.");
      }
    } catch {
      setError("Could not connect. Check your internet and try again.");
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Nav */}
      <nav className="border-b border-warm-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-warm-700">Schedule</span>
            <svg width="18" height="16" viewBox="0 0 24 22" fill="none">
              <defs>
                <linearGradient id="hg" x1="0" y1="0" x2="24" y2="22" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#ab65ba" /><stop offset="0.5" stopColor="#b2cfee" /><stop offset="1" stopColor="#ee0d63" />
                </linearGradient>
              </defs>
              <path d="M12 21C12 21 1 14.1 1 7.3C1 3.8 3.7 1.5 6.8 1.5C9 1.5 10.9 2.8 12 4.8C13.1 2.8 15 1.5 17.2 1.5C20.3 1.5 23 3.8 23 7.3C23 14.1 12 21 12 21Z" fill="url(#hg)" />
            </svg>
            <span className="text-xl font-bold tracking-tight text-pink">Hub</span>
          </Link>
        </div>
      </nav>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          {!sent ? (
            <>
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-warm-900">Provider Login</h1>
                <p className="text-sm text-warm-500">
                  Enter your email and we&apos;ll send you a sign-in link.
                  No passwords.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-warm-700 mb-1">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="doctor@practice.com"
                    className="w-full border border-warm-300 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky focus:border-transparent"
                  />
                </div>

                {error && (
                  <p className="text-sm text-pink bg-pink/10 border border-pink/20 rounded-xl px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-2.5 bg-sky text-warm-800 rounded-xl font-semibold text-sm hover:bg-sky-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Sending..." : "Send sign-in link"}
                </button>
              </form>

              <p className="text-center text-xs text-warm-400">
                Only authorized providers can sign in.
                Contact your practice administrator if you need access.
              </p>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-olive/20 flex items-center justify-center text-3xl">
                &#9993;
              </div>
              <h1 className="text-2xl font-bold text-warm-900">Check your email</h1>
              <p className="text-sm text-warm-500">
                We sent a sign-in link to <span className="font-medium text-warm-700">{email}</span>.
                Click the link to access your dashboard.
              </p>
              <p className="text-xs text-warm-400">
                Link expires in 5 minutes. Check spam if you don&apos;t see it.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="text-sm text-pink font-medium hover:text-pink-dark"
              >
                Use a different email
              </button>
            </div>
          )}

          {/* Demo shortcut */}
          <div className="border-t border-warm-200 pt-6">
            <p className="text-xs text-warm-400 text-center mb-3">Demo shortcuts (no auth required)</p>
            <div className="flex gap-2">
              <Link href="/doctor"
                className="flex-1 text-center px-3 py-2 border border-warm-200 rounded-xl text-xs text-warm-500 hover:bg-blush transition-colors">
                Doctor Portal
              </Link>
              <Link href="/admin"
                className="flex-1 text-center px-3 py-2 border border-warm-200 rounded-xl text-xs text-warm-500 hover:bg-blush transition-colors">
                Coordinator
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
