"use client";

import Image from "next/image";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { POI_META, type PoiFeedItem } from "@/lib/types";
import { formatDistanceShort } from "@/lib/geo";
import { TimeAgo } from "@/components/time-ago";

/**
 * Pin detail (FR-5): photo, description, distance from user, submitted-by
 * and timestamp — plus the FR-6 report action.
 */
export function PoiDetailSheet({
  poi,
  currentUserId,
  distanceKm,
  onClose,
}: {
  poi: PoiFeedItem;
  currentUserId: string;
  distanceKm: number | null;
  onClose: () => void;
}) {
  const meta = POI_META[poi.category];
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function report(reason: string) {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("poi_reports").insert({
      poi_id: poi.id,
      user_id: currentUserId,
      reason,
    });

    if (error) {
      // The unique(poi_id, user_id) constraint means a second report from
      // the same user is a no-op, not a failure worth alarming them about.
      setReported(error.code === "23505");
      if (error.code !== "23505") setError("Couldn't send the report.");
    } else {
      setReported(true);
    }
    setReporting(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={poi.title}
    >
      <div
        className="max-h-[85dvh] w-full overflow-y-auto rounded-t-xl bg-surface pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex justify-center bg-surface pb-2 pt-3">
          <div className="h-1 w-10 rounded-full bg-outline-variant" />
        </div>

        {poi.photo_url && (
          <div className="relative mx-margin-mobile mb-4 aspect-video overflow-hidden rounded-lg bg-surface-container">
            <Image
              src={poi.photo_url}
              alt={poi.title}
              fill
              sizes="(max-width: 768px) 100vw, 640px"
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        <div className="px-margin-mobile">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-label-caps font-bold uppercase tracking-wide text-white"
            style={{ backgroundColor: meta.pin }}
          >
            <span
              className="material-symbols-outlined icon-filled text-[14px]"
              aria-hidden="true"
            >
              {meta.icon}
            </span>
            {meta.label}
          </span>

          <h2 className="mt-stack-sm text-title-md font-semibold text-on-surface">
            {poi.title}
          </h2>

          {poi.note && (
            <p className="mt-2 text-body-lg text-on-surface-variant">
              {poi.note}
            </p>
          )}

          <dl className="mt-stack-md grid grid-cols-2 gap-4 border-t border-outline-variant/40 pt-stack-md">
            {distanceKm !== null && (
              <div>
                <dt className="text-label-caps uppercase tracking-wide text-on-surface-variant">
                  Distance
                </dt>
                <dd className="text-body-lg font-semibold text-on-surface">
                  {formatDistanceShort(distanceKm)} away
                </dd>
              </div>
            )}
            <div>
              <dt className="text-label-caps uppercase tracking-wide text-on-surface-variant">
                Added by
              </dt>
              <dd className="truncate text-body-lg font-semibold text-on-surface">
                {poi.submitted_by}
              </dd>
            </div>
            <div>
              <dt className="text-label-caps uppercase tracking-wide text-on-surface-variant">
                When
              </dt>
              <dd className="text-body-lg font-semibold text-on-surface">
                <TimeAgo iso={poi.created_at} />
              </dd>
            </div>
          </dl>

          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-stack-md flex h-touch-target w-full items-center justify-center gap-2 rounded-full bg-primary-container font-semibold text-on-primary-container active:scale-95"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              directions
            </span>
            Get directions
          </a>

          {/* FR-6: report/flag */}
          <div className="mt-stack-md border-t border-outline-variant/40 pt-stack-md">
            {reported ? (
              <p className="text-center text-body-md text-on-surface-variant">
                Thanks — we&apos;ll review this point.
              </p>
            ) : reporting ? (
              <div className="flex flex-col gap-2">
                <p className="text-body-md font-semibold text-on-surface">
                  What&apos;s wrong with this point?
                </p>
                {[
                  "Not there any more",
                  "Wrong location",
                  "Inappropriate content",
                  "Spam",
                ].map((r) => (
                  <button
                    key={r}
                    onClick={() => report(r)}
                    className="h-12 rounded-lg border border-outline-variant text-body-md text-on-surface active:scale-95"
                  >
                    {r}
                  </button>
                ))}
                <button
                  onClick={() => setReporting(false)}
                  className="h-12 text-body-md text-on-surface-variant"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setReporting(true)}
                className="flex w-full items-center justify-center gap-1.5 text-body-md text-on-surface-variant"
              >
                <span
                  className="material-symbols-outlined text-[18px]"
                  aria-hidden="true"
                >
                  flag
                </span>
                Report this point
              </button>
            )}
            {error && (
              <p role="alert" className="mt-2 text-center text-body-md text-error">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
