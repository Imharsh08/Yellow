"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ next }: { next: string }) {
  const [loading, setLoading] = useState<"google" | "email" | null>(null);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmail, setShowEmail] = useState(false);

  async function signInWithGoogle() {
    setError(null);
    setLoading("google");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) {
      setError(
        "Google sign-in isn't set up yet. Use email instead, or add the Google provider in Supabase.",
      );
      setShowEmail(true);
      setLoading(null);
    }
    // On success the browser navigates to Google; no state reset needed.
  }

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading("email");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setLoading(null);
    if (error) setError(error.message);
    else setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-outline-variant/40 bg-surface-container-low p-6 text-center">
        <span
          className="material-symbols-outlined text-[32px] text-primary"
          aria-hidden="true"
        >
          mark_email_read
        </span>
        <p className="mt-stack-sm text-body-lg font-semibold text-on-surface">
          Check your email
        </p>
        <p className="mt-1 text-body-md text-on-surface-variant">
          We sent a sign-in link to {email}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-stack-sm">
      <button
        onClick={signInWithGoogle}
        disabled={loading !== null}
        className="flex h-touch-target w-full items-center justify-center gap-3 rounded-full bg-primary-container px-6 text-body-lg font-semibold text-on-primary-container shadow-[0_4px_20px_rgba(255,153,51,0.25)] transition-transform duration-200 active:scale-95 disabled:opacity-60"
      >
        {loading === "google" ? (
          "Signing in…"
        ) : (
          <>
            <GoogleMark />
            Continue with Google
          </>
        )}
      </button>

      {!showEmail && (
        <button
          onClick={() => setShowEmail(true)}
          className="h-touch-target w-full rounded-full border-2 border-on-surface/20 text-body-lg font-semibold text-on-surface transition-transform duration-200 active:scale-95"
        >
          Continue with email
        </button>
      )}

      {showEmail && (
        <form onSubmit={signInWithEmail} className="flex flex-col gap-stack-sm">
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-touch-target w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-body-lg text-on-surface outline-none placeholder:text-on-surface-variant/60 focus:ring-[3px] focus:ring-primary-container"
          />
          <button
            type="submit"
            disabled={loading !== null || !email}
            className="h-touch-target w-full rounded-full bg-on-surface text-body-lg font-semibold text-surface transition-transform duration-200 active:scale-95 disabled:opacity-50"
          >
            {loading === "email" ? "Sending…" : "Send sign-in link"}
          </button>
        </form>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-md bg-error-container px-4 py-3 text-body-md text-on-error-container"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 40.2 44 35 44 24c0-1.3-.1-2.6-.4-3.9z"
      />
    </svg>
  );
}
