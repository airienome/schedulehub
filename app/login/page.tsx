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
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">Schedule<span className="text-blue-600">Hub</span></span>
          </Link>
        </div>
      </nav>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          {!sent ? (
            <>
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold">Provider Login</h1>
                <p className="text-sm text-gray-500">
                  Enter your email and we&apos;ll send you a sign-in link.
                  No passwords.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Sending..." : "Send sign-in link"}
                </button>
              </form>

              <p className="text-center text-xs text-gray-400">
                Only authorized providers can sign in.
                Contact your practice administrator if you need access.
              </p>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-50 flex items-center justify-center text-3xl">
                &#9993;
              </div>
              <h1 className="text-2xl font-bold">Check your email</h1>
              <p className="text-sm text-gray-500">
                We sent a sign-in link to <span className="font-medium text-gray-700">{email}</span>.
                Click the link to access your dashboard.
              </p>
              <p className="text-xs text-gray-400">
                Link expires in 5 minutes. Check spam if you don&apos;t see it.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Use a different email
              </button>
            </div>
          )}

          {/* Demo shortcut */}
          <div className="border-t border-gray-200 pt-6">
            <p className="text-xs text-gray-400 text-center mb-3">Demo shortcuts (no auth required)</p>
            <div className="flex gap-2">
              <Link href="/doctor"
                className="flex-1 text-center px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50 transition-colors">
                Doctor Portal
              </Link>
              <Link href="/admin"
                className="flex-1 text-center px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50 transition-colors">
                Coordinator
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
