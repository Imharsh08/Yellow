"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useGeolocation } from "@/lib/use-geolocation";
import {
  locateOnRoute,
  formatKm,
  kmToSteps,
  formatWalkingTime,
} from "@/lib/geo";
import type { Checkpoint, Route, UserProgress } from "@/lib/types";
import { WeatherCard } from "@/components/weather-card";
import { AnimatedNumber } from "@/components/animated-number";

// Each card opens the nearby list for that category; the map is one tap
// further in. While walking, "what's closest" is the question being asked.
const SERVICES = [
  {
    href: "/services/bhojan_shivir",
    icon: "restaurant",
    title: "Bhojan Shivir",
    sub: "Free meals",
    bg: "bg-tertiary-fixed-dim/20",
    fg: "text-tertiary",
  },
  {
    href: "/services/medical_point",
    icon: "local_hospital",
    title: "Medical Point",
    sub: "First aid",
    bg: "bg-error-container",
    fg: "text-error",
  },
  {
    href: "/services/charging_point",
    icon: "battery_charging_full",
    title: "Charging",
    sub: "Power banks",
    bg: "bg-secondary-fixed/50",
    fg: "text-secondary",
  },
  {
    href: "/services/rush_area",
    icon: "groups",
    title: "Rush Area",
    sub: "Crowd status",
    bg: "bg-surface-tint/10",
    fg: "text-surface-tint",
  },
] as const;

export function Dashboard({
  firstName,
  route,
  checkpoints,
  initialProgress,
}: {
  firstName: string;
  route: Route | null;
  checkpoints: Checkpoint[];
  initialProgress: UserProgress | null;
}) {
  const { position, error, loading, stale } = useGeolocation();
  const totalKm = Number(route?.total_km ?? 0);

  const located = useMemo(
    () => locateOnRoute(position, checkpoints, totalKm),
    [position, checkpoints, totalKm],
  );

  // Before the first GPS fix, fall back to the last value saved on the
  // server so the screen is never blank on a cold, signal-less start.
  const showing = position
    ? located
    : {
        ...located,
        kmCovered: Number(initialProgress?.km_covered ?? 0),
        kmRemaining: Math.max(
          totalKm - Number(initialProgress?.km_covered ?? 0),
          0,
        ),
        progress: totalKm
          ? Number(initialProgress?.km_covered ?? 0) / totalKm
          : 0,
      };

  useProgressSync({
    position,
    located,
    routeId: route?.id ?? null,
    initialProgress,
  });

  const done = showing.kmRemaining <= 0.2 && showing.kmCovered > 0;

  return (
    <div className="flex flex-col gap-stack-lg py-stack-md">
      <p className="text-body-lg text-on-surface-variant">
        Har Har Mahadev, <span className="font-semibold">{firstName}</span> 🙏
      </p>

      {/* ---- Hero: distance tracker (FR-7) ---- */}
      <section className="relative flex flex-col items-center overflow-hidden rounded-xl border border-outline-variant/30 bg-surface p-6 text-center shadow-[0_4px_20px_rgba(255,153,51,0.08)]">
        <WeatherCard position={position} />

        <div className="mb-4 mt-8 flex size-16 items-center justify-center rounded-full bg-primary-container/20">
          <span
            className="material-symbols-outlined text-[32px] text-primary"
            aria-hidden="true"
          >
            directions_walk
          </span>
        </div>

        {done ? (
          <>
            <p className="text-[44px] font-extrabold leading-tight tracking-tight text-on-surface">
              Yatra complete
            </p>
            <p className="mt-1 text-title-md text-primary">
              You walked {formatKm(showing.kmCovered)} 🎉
            </p>
          </>
        ) : (
          <>
            <AnimatedNumber
              value={showing.kmRemaining}
              className="text-[48px] font-extrabold leading-[56px] tracking-tighter tabular-nums text-on-surface"
            />
            <p className="mt-1 text-title-md text-primary">
              km to {route?.dest_name ?? "your destination"}
            </p>
          </>
        )}

        <div
          className="mt-6 h-2 w-full overflow-hidden rounded-full bg-surface-variant"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(showing.progress * 100)}
          aria-label="Journey progress"
        >
          <div
            className="h-full rounded-full bg-primary-container shadow-[0_0_10px_rgba(255,153,51,0.5)] transition-[width] duration-700"
            style={{ width: `${Math.max(showing.progress * 100, 1)}%` }}
          />
        </div>

        {!done && (
          <p className="mt-stack-sm flex items-center justify-center gap-1.5 text-body-lg font-semibold text-on-surface">
            <span
              className="material-symbols-outlined text-[18px] text-primary"
              aria-hidden="true"
            >
              schedule
            </span>
            About {formatWalkingTime(showing.kmRemaining)} of walking left
          </p>
        )}

        <p className="mt-2 text-body-md text-on-surface-variant">
          {formatKm(showing.kmCovered)} walked ·{" "}
          {kmToSteps(showing.kmCovered).toLocaleString("en-IN")} steps
          {!done &&
            ` · ${kmToSteps(showing.kmRemaining).toLocaleString("en-IN")} steps to go`}
        </p>

        {/* Location status — honest about what the number is based on. */}
        {loading && !position && (
          <p className="mt-2 text-label-caps uppercase tracking-wide text-on-surface-variant">
            Finding your location…
          </p>
        )}
        {stale && (
          <p className="mt-2 text-label-caps uppercase tracking-wide text-on-surface-variant">
            Last known position
          </p>
        )}
        {error && (
          <p className="mt-2 max-w-xs text-body-md text-on-surface-variant">
            {error}
          </p>
        )}
      </section>

      {/* ---- Next milestone (FR-8) ---- */}
      {showing.nextCheckpoint && !done && (
        <Link
          href="/roadmap"
          className="flex items-center gap-4 rounded-xl border border-outline-variant/30 bg-surface p-4 shadow-sm active:scale-[0.99]"
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary-container/20">
            <span
              className="material-symbols-outlined text-primary"
              aria-hidden="true"
            >
              flag
            </span>
          </div>
          <div className="flex-1 text-left">
            <p className="text-label-caps uppercase tracking-wide text-on-surface-variant">
              Next milestone
            </p>
            <p className="text-title-md font-semibold text-on-surface">
              {showing.nextCheckpoint.name}
            </p>
            {showing.kmToNextCheckpoint !== null && (
              <p className="text-body-md text-on-surface-variant">
                {formatKm(showing.kmToNextCheckpoint)} away
              </p>
            )}
          </div>
          <span
            className="material-symbols-outlined text-outline"
            aria-hidden="true"
          >
            chevron_right
          </span>
        </Link>
      )}

      {/* ---- Essential services (FR-5 entry points) ---- */}
      <section>
        <h2 className="mb-stack-sm text-title-md font-semibold text-on-surface">
          Essential Services
        </h2>
        <div className="grid grid-cols-2 gap-gutter">
          {SERVICES.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="flex min-h-touch-target flex-col items-start gap-3 rounded-xl border border-outline-variant/30 bg-surface p-4 shadow-sm transition-transform duration-200 active:scale-95"
            >
              <div
                className={`flex size-10 items-center justify-center rounded-full ${s.bg}`}
              >
                <span
                  className={`material-symbols-outlined ${s.fg}`}
                  aria-hidden="true"
                >
                  {s.icon}
                </span>
              </div>
              <div className="text-left">
                <span className="block text-[16px] font-semibold text-on-surface">
                  {s.title}
                </span>
                <span className="mt-1 block text-label-caps uppercase tracking-wide text-on-surface-variant">
                  {s.sub}
                </span>
              </div>
            </Link>
          ))}

          <Link
            href="/feed"
            className="col-span-2 flex min-h-touch-target items-center gap-4 rounded-xl border border-outline-variant/30 bg-surface p-4 shadow-sm transition-transform duration-200 active:scale-95"
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary-container">
              <span
                className="material-symbols-outlined icon-filled text-on-primary-container"
                aria-hidden="true"
              >
                play_arrow
              </span>
            </div>
            <div className="flex-1 text-left">
              <span className="block text-title-md font-semibold text-on-surface">
                Community Vlogs
              </span>
              <span className="mt-0.5 block text-body-md text-on-surface-variant">
                Watch journey stories
              </span>
            </div>
            <span
              className="material-symbols-outlined text-outline"
              aria-hidden="true"
            >
              chevron_right
            </span>
          </Link>
        </div>
      </section>

      {/* ---- Diet plan (FR-10) ---- */}
      <Link
        href="/diet"
        className="flex items-center gap-4 rounded-xl border border-outline-variant/30 bg-surface p-4 shadow-sm active:scale-[0.99]"
      >
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-tertiary-fixed-dim/20">
          <span
            className="material-symbols-outlined text-tertiary"
            aria-hidden="true"
          >
            nutrition
          </span>
        </div>
        <div className="flex-1 text-left">
          <span className="block text-title-md font-semibold text-on-surface">
            Yatra Diet Plan
          </span>
          <span className="mt-0.5 block text-body-md text-on-surface-variant">
            What to eat on a multi-day walk
          </span>
        </div>
        <span
          className="material-symbols-outlined text-outline"
          aria-hidden="true"
        >
          chevron_right
        </span>
      </Link>
    </div>
  );
}

/**
 * Persists progress to Supabase.
 *
 * Throttled to one write per 2 minutes, and only when the walker has
 * actually advanced. Continuous GPS already threatens battery life on a
 * multi-day walk (BRD §11); a write on every fix would add needless radio
 * wake-ups on top of that.
 */
function useProgressSync({
  position,
  located,
  routeId,
  initialProgress,
}: {
  position: { lat: number; lng: number } | null;
  located: ReturnType<typeof locateOnRoute>;
  routeId: string | null;
  initialProgress: UserProgress | null;
}) {
  const lastWrite = useRef(0);
  const [best, setBest] = useState(Number(initialProgress?.km_covered ?? 0));

  useEffect(() => {
    if (!position || !routeId) return;

    const now = Date.now();
    if (now - lastWrite.current < 120_000) return;

    // Distance covered should never move backwards — a noisy fix behind
    // the walker must not erase progress they already earned.
    const km = Math.max(located.kmCovered, best);

    lastWrite.current = now;
    setBest(km);

    const supabase = createClient();
    void supabase
      .from("user_progress")
      .update({
        last_lat: position.lat,
        last_lng: position.lng,
        last_seen_at: new Date().toISOString(),
        km_covered: Number(km.toFixed(2)),
        last_checkpoint_seq: located.lastReachedSeq,
        ...(located.kmRemaining <= 0.2 && !initialProgress?.completed_at
          ? { completed_at: new Date().toISOString() }
          : {}),
      })
      .eq("route_id", routeId)
      .then(({ error }) => {
        // A failed sync is expected on this route; the next fix retries.
        if (error) console.warn("progress sync failed", error.message);
      });
  }, [position, located, routeId, best, initialProgress?.completed_at]);
}
