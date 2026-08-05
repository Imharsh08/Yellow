"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useGeolocation } from "@/lib/use-geolocation";
import { haversineKm, formatDistanceShort } from "@/lib/geo";
import type { PoiFeedItem } from "@/lib/types";
import { TimeAgo } from "@/components/time-ago";

/**
 * Community vlog feed (FR-4 "Personal Vlog" category).
 *
 * Vlogs are stories about the walk rather than places to go to, so they
 * read as a chronological feed instead of map pins. Location is still
 * captured and shown as "x km away" for context.
 */
export function FeedList({ vlogs }: { vlogs: PoiFeedItem[] }) {
  const { position } = useGeolocation();

  if (vlogs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-stack-sm py-stack-lg text-center">
        <span
          className="material-symbols-outlined text-[40px] text-outline"
          aria-hidden="true"
        >
          play_circle
        </span>
        <p className="text-body-lg text-on-surface-variant">
          No stories shared yet.
        </p>
        <p className="max-w-xs text-body-md text-on-surface-variant">
          Share a moment from your yatra — what you saw, where you stopped,
          what helped.
        </p>
        <Link
          href="/report"
          className="mt-stack-sm flex h-touch-target items-center gap-2 rounded-full bg-primary-container px-6 font-semibold text-on-primary-container active:scale-95"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            add
          </span>
          Share your story
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-stack-md py-stack-md">
      {vlogs.map((v) => (
        <FeedCard
          key={v.id}
          vlog={v}
          distanceKm={position ? haversineKm(position, v) : null}
        />
      ))}

      <Link
        href="/report"
        className="flex h-touch-target items-center justify-center gap-2 rounded-full border-2 border-on-surface/20 font-semibold text-on-surface active:scale-95"
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          add
        </span>
        Share your story
      </Link>
    </div>
  );
}

function FeedCard({
  vlog,
  distanceKm,
}: {
  vlog: PoiFeedItem;
  distanceKm: number | null;
}) {
  const [reported, setReported] = useState(false);
  const [busy, setBusy] = useState(false);

  async function report() {
    setBusy(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase.from("poi_reports").insert({
        poi_id: vlog.id,
        user_id: user.id,
        reason: "Reported from feed",
      });
      // 23505 = already reported by this user; treat as success.
      setReported(!error || error.code === "23505");
    }
    setBusy(false);
  }

  return (
    <article className="overflow-hidden rounded-xl border border-outline-variant/30 bg-surface">
      {vlog.photo_url && (
        <div className="relative aspect-video bg-surface-container">
          <Image
            src={vlog.photo_url}
            alt={vlog.title}
            fill
            sizes="(max-width: 768px) 100vw, 512px"
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary-container/20 text-body-md font-bold text-primary">
            {vlog.submitted_by.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-body-md font-semibold text-on-surface">
              {vlog.submitted_by}
            </p>
            <p className="text-label-caps uppercase tracking-wide text-on-surface-variant">
              <TimeAgo iso={vlog.created_at} />
              {distanceKm !== null && ` · ${formatDistanceShort(distanceKm)} away`}
            </p>
          </div>
        </div>

        <h2 className="mt-stack-sm text-title-md font-semibold text-on-surface">
          {vlog.title}
        </h2>
        {vlog.note && (
          <p className="mt-1 whitespace-pre-line text-body-lg text-on-surface-variant">
            {vlog.note}
          </p>
        )}

        <div className="mt-stack-sm flex items-center gap-4 border-t border-outline-variant/40 pt-stack-sm">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${vlog.lat},${vlog.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-body-md text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              location_on
            </span>
            See location
          </a>

          <button
            onClick={report}
            disabled={busy || reported}
            className="ml-auto flex items-center gap-1.5 text-body-md text-on-surface-variant disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              flag
            </span>
            {reported ? "Reported" : "Report"}
          </button>
        </div>
      </div>
    </article>
  );
}
