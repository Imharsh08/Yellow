"use client";

import { useMemo } from "react";
import { useGeolocation } from "@/lib/use-geolocation";
import { locateOnRoute, formatKm, kmToSteps, haversineKm } from "@/lib/geo";
import type { Checkpoint } from "@/lib/types";

/**
 * Checkpoint roadmap (FR-8): the route as a vertical timeline, each
 * milestone showing the steps/km needed and marked complete once reached.
 */
export function RoadmapList({
  checkpoints,
  totalKm,
  destName,
}: {
  checkpoints: Checkpoint[];
  totalKm: number;
  destName: string;
}) {
  const { position } = useGeolocation();

  const located = useMemo(
    () => locateOnRoute(position, checkpoints, totalKm),
    [position, checkpoints, totalKm],
  );

  if (checkpoints.length === 0) {
    return (
      <p className="py-stack-lg text-center text-body-lg text-on-surface-variant">
        Route milestones haven&apos;t been loaded yet.
      </p>
    );
  }

  return (
    <div className="py-stack-md">
      <div className="mb-stack-md rounded-xl border border-outline-variant/30 bg-surface p-4">
        <p className="text-label-caps uppercase tracking-wide text-on-surface-variant">
          Progress to {destName}
        </p>
        <p className="mt-1 text-title-md font-semibold text-on-surface">
          {formatKm(located.kmCovered)} of {formatKm(totalKm)}
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-variant">
          <div
            className="h-full rounded-full bg-primary-container transition-[width] duration-700"
            style={{ width: `${Math.max(located.progress * 100, 1)}%` }}
          />
        </div>
      </div>

      <ol className="relative">
        {checkpoints.map((cp, i) => {
          const reached = position
            ? Number(cp.km_from_start) <= located.kmCovered + 0.15
            : false;
          const isNext =
            located.nextCheckpoint?.id === cp.id && !reached;
          const last = i === checkpoints.length - 1;

          const legKm =
            i === 0
              ? 0
              : Number(cp.km_from_start) -
                Number(checkpoints[i - 1].km_from_start);

          const away = position ? haversineKm(position, cp) : null;

          return (
            <li key={cp.id} className="relative flex gap-4 pb-6">
              {/* connector */}
              {!last && (
                <span
                  aria-hidden="true"
                  className={`absolute left-[15px] top-8 h-full w-0.5 ${
                    reached ? "bg-primary-container" : "bg-outline-variant/50"
                  }`}
                />
              )}

              {/* node */}
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
                  {reached ? "check" : isNext ? "directions_walk" : "circle"}
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
                    {Number(cp.km_from_start).toFixed(0)} km
                  </span>
                </div>

                {isNext && (
                  <p className="mt-1 text-body-md font-semibold text-primary">
                    Next up
                    {away !== null && ` — ${formatKm(away)} away`}
                  </p>
                )}

                {!reached && legKm > 0 && (
                  <p className="mt-1 text-body-md text-on-surface-variant">
                    {formatKm(legKm)} from the last stop ·{" "}
                    {kmToSteps(legKm).toLocaleString("en-IN")} steps
                  </p>
                )}

                {cp.notes && (
                  <span className="mt-1.5 inline-block rounded-full bg-tertiary-fixed/60 px-2.5 py-0.5 text-label-caps font-bold uppercase tracking-wide text-on-tertiary-fixed-variant">
                    {cp.notes}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {!position && (
        <p className="pb-stack-md text-center text-body-md text-on-surface-variant">
          Turn on location to see which milestones you&apos;ve reached.
        </p>
      )}
    </div>
  );
}
