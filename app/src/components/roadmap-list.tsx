"use client";

import { useMemo } from "react";
import { useGeolocation } from "@/lib/use-geolocation";
import {
  locateOnRoute,
  formatKm,
  kmToSteps,
  formatWalkingTime,
  haversineKm,
} from "@/lib/geo";
import type { Checkpoint } from "@/lib/types";

/**
 * Checkpoint roadmap (FR-8).
 *
 * Answers three questions at a glance: where am I, how much is left, and
 * how long will it take. Every figure is measured from the walker's live
 * position rather than from the route origin, so it stays meaningful for
 * someone who joined the route partway.
 */
export function RoadmapList({
  checkpoints,
  totalKm,
  destName,
  originName,
}: {
  checkpoints: Checkpoint[];
  totalKm: number;
  destName: string;
  originName: string;
}) {
  const { position, loading } = useGeolocation();

  const located = useMemo(
    () => locateOnRoute(position, checkpoints, totalKm),
    [position, checkpoints, totalKm],
  );

  if (checkpoints.length === 0) {
    return (
      <div className="flex flex-col items-center gap-stack-sm py-stack-lg text-center">
        <span
          className="material-symbols-outlined text-[40px] text-outline"
          aria-hidden="true"
        >
          route
        </span>
        <p className="text-body-lg text-on-surface-variant">
          No route milestones loaded for {destName} yet.
        </p>
      </div>
    );
  }

  const ordered = [...checkpoints].sort((a, b) => a.seq - b.seq);

  // Index of the first checkpoint still ahead — where the "You are here"
  // marker slots into the timeline.
  const nextIdx = position
    ? ordered.findIndex(
        (cp) => Number(cp.km_from_start) > located.kmCovered + 0.15,
      )
    : -1;

  return (
    <div className="py-stack-md">
      {/* ---- Summary: where I am, what's left, how long ---- */}
      <section className="mb-stack-md rounded-xl border border-outline-variant/30 bg-surface p-4">
        <p className="text-label-caps uppercase tracking-wide text-on-surface-variant">
          {originName} → {destName}
        </p>

        <p className="mt-1 text-[32px] font-extrabold leading-tight tabular-nums text-on-surface">
          {formatKm(located.kmRemaining)}
          <span className="ml-2 text-body-lg font-semibold text-primary">
            to go
          </span>
        </p>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-variant">
          <div
            className="h-full rounded-full bg-primary-container transition-[width] duration-700"
            style={{ width: `${Math.max(located.progress * 100, 1)}%` }}
          />
        </div>

        <dl className="mt-stack-md grid grid-cols-3 gap-2 border-t border-outline-variant/40 pt-stack-sm">
          <Metric
            label="Walked"
            value={formatKm(located.kmCovered)}
            icon="footprint"
          />
          <Metric
            label="Steps left"
            value={kmToSteps(located.kmRemaining).toLocaleString("en-IN")}
            icon="steps"
          />
          <Metric
            label="Time left"
            value={formatWalkingTime(located.kmRemaining)}
            icon="schedule"
          />
        </dl>

        {!position && (
          <p className="mt-stack-sm text-body-md text-on-surface-variant">
            {loading
              ? "Finding your location…"
              : "Turn on location to see your live progress."}
          </p>
        )}
      </section>

      {/* ---- Timeline ---- */}
      <ol className="relative">
        {ordered.map((cp, i) => {
          const kmFromStart = Number(cp.km_from_start);
          const reached = position
            ? kmFromStart <= located.kmCovered + 0.15
            : false;
          const isNext = i === nextIdx;
          const last = i === ordered.length - 1;

          // Distance still to walk to this milestone, measured from the
          // walker's position along the route — not from the origin.
          const kmToHere = Math.max(kmFromStart - located.kmCovered, 0);
          const straightLine = position ? haversineKm(position, cp) : null;

          return (
            <li key={cp.id}>
              {/* You-are-here marker sits between the last reached
                  checkpoint and the next one. */}
              {isNext && position && (
                <div className="relative flex gap-4 pb-6">
                  <span
                    aria-hidden="true"
                    className="absolute left-[15px] top-8 h-full w-0.5 bg-outline-variant/50"
                  />
                  <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary text-on-primary shadow-[0_0_0_4px_rgba(255,153,51,0.25)]">
                    <span
                      className="material-symbols-outlined icon-filled text-[18px]"
                      aria-hidden="true"
                    >
                      person_pin_circle
                    </span>
                  </span>
                  <div className="flex-1 pt-1">
                    <p className="text-body-lg font-bold text-primary">
                      You are here
                    </p>
                    <p className="text-body-md text-on-surface-variant">
                      {formatKm(located.kmCovered)} walked ·{" "}
                      {Math.round(located.progress * 100)}% done
                    </p>
                  </div>
                </div>
              )}

              <div className="relative flex gap-4 pb-6">
                {!last && (
                  <span
                    aria-hidden="true"
                    className={`absolute left-[15px] top-8 h-full w-0.5 ${
                      reached ? "bg-primary-container" : "bg-outline-variant/50"
                    }`}
                  />
                )}

                <span
                  className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 ${
                    reached
                      ? "border-primary-container bg-primary-container text-on-primary-container"
                      : isNext
                        ? "border-primary-container bg-surface text-primary"
                        : "border-outline-variant bg-surface text-on-surface-variant"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[18px] ${reached ? "icon-filled" : ""}`}
                    aria-hidden="true"
                  >
                    {reached ? "check" : isNext ? "flag" : "circle"}
                  </span>
                </span>

                <div className="flex-1 pt-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p
                      className={`text-body-lg font-semibold ${
                        reached ? "text-on-surface" : "text-on-surface-variant"
                      }`}
                    >
                      {cp.name}
                    </p>
                    <span className="shrink-0 text-label-caps uppercase tracking-wide text-on-surface-variant">
                      {kmFromStart.toFixed(0)} km
                    </span>
                  </div>

                  {reached ? (
                    <p className="mt-1 text-body-md font-semibold text-primary">
                      Reached
                    </p>
                  ) : position ? (
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <Chip
                        icon="near_me"
                        text={formatKm(kmToHere)}
                        highlight={isNext}
                      />
                      <Chip
                        icon="steps"
                        text={`${kmToSteps(kmToHere).toLocaleString("en-IN")} steps`}
                      />
                      <Chip
                        icon="schedule"
                        text={formatWalkingTime(kmToHere)}
                      />
                    </div>
                  ) : (
                    <p className="mt-1 text-body-md text-on-surface-variant">
                      {kmToSteps(kmFromStart).toLocaleString("en-IN")} steps from{" "}
                      {originName}
                    </p>
                  )}

                  {isNext && straightLine !== null && (
                    <p className="mt-1 text-body-md text-on-surface-variant">
                      {formatKm(straightLine)} in a straight line
                    </p>
                  )}

                  {cp.notes && (
                    <span className="mt-1.5 inline-block rounded-full bg-tertiary-fixed/60 px-2.5 py-0.5 text-label-caps font-bold uppercase tracking-wide text-on-tertiary-fixed-variant">
                      {cp.notes}
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-label-caps uppercase tracking-wide text-on-surface-variant">
        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
          {icon}
        </span>
        {label}
      </dt>
      <dd className="mt-0.5 text-body-lg font-bold tabular-nums text-on-surface">
        {value}
      </dd>
    </div>
  );
}

function Chip({
  icon,
  text,
  highlight = false,
}: {
  icon: string;
  text: string;
  highlight?: boolean;
}) {
  return (
    <span
      className={`flex items-center gap-1 text-body-md ${
        highlight ? "font-semibold text-primary" : "text-on-surface-variant"
      }`}
    >
      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
        {icon}
      </span>
      {text}
    </span>
  );
}
