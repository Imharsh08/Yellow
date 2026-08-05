"use client";

import Link from "next/link";
import { useState } from "react";
import { formatKm } from "@/lib/geo";

/**
 * FR-11: free, shareable completion certificate with name, distance and
 * date. Rendered as DOM rather than a generated image so it stays crisp
 * and costs nothing to produce; sharing uses the Web Share API where
 * available and falls back to copying a link.
 */
export function CertificateCard({
  name,
  destination,
  km,
  completedAt,
}: {
  name: string;
  destination: string;
  km: number;
  completedAt: string;
}) {
  const [copied, setCopied] = useState(false);

  const date = new Date(completedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function share() {
    const text = `I completed my Kanwar Yatra to ${destination} — ${formatKm(km)} on foot. 🙏 Har Har Mahadev`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "My Kanwar Yatra", text });
        return;
      } catch {
        // User dismissed the share sheet — nothing to report.
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-xl border-4 border-primary-container bg-surface-container-lowest p-6 text-center shadow-lg">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-primary-container/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-10 -left-10 size-32 rounded-full bg-tertiary-container/10"
        />

        <p className="text-label-caps uppercase tracking-[0.2em] text-primary">
          Certificate of Completion
        </p>

        <div className="mx-auto my-stack-md flex size-16 items-center justify-center rounded-full bg-primary-container">
          <span
            className="material-symbols-outlined icon-filled text-[32px] text-on-primary-container"
            aria-hidden="true"
          >
            workspace_premium
          </span>
        </div>

        <p className="text-body-md text-on-surface-variant">
          This is to certify that
        </p>
        <p className="mt-2 text-[28px] font-extrabold leading-tight text-on-surface">
          {name}
        </p>
        <p className="mt-stack-sm text-body-lg text-on-surface-variant">
          completed the Kanwar Yatra on foot to
        </p>
        <p className="text-title-md font-bold text-primary">{destination}</p>

        <div className="mx-auto mt-stack-md flex max-w-xs justify-around border-t border-outline-variant/40 pt-stack-md">
          <div>
            <p className="text-label-caps uppercase tracking-wide text-on-surface-variant">
              Distance
            </p>
            <p className="text-title-md font-bold text-on-surface">
              {formatKm(km)}
            </p>
          </div>
          <div>
            <p className="text-label-caps uppercase tracking-wide text-on-surface-variant">
              Completed
            </p>
            <p className="text-title-md font-bold text-on-surface">{date}</p>
          </div>
        </div>

        <p className="mt-stack-md text-title-md font-bold text-secondary">
          हर हर महादेव
        </p>
      </div>

      <div className="mt-stack-md flex flex-col gap-stack-sm">
        <button
          onClick={share}
          className="flex h-touch-target items-center justify-center gap-2 rounded-full bg-primary-container font-semibold text-on-primary-container active:scale-95"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            share
          </span>
          {copied ? "Copied!" : "Share"}
        </button>
        <Link
          href="/profile"
          className="flex h-touch-target items-center justify-center rounded-full border-2 border-on-surface/20 font-semibold text-on-surface"
        >
          Back to profile
        </Link>
      </div>
    </>
  );
}
