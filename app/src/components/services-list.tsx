"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { useGeolocation } from "@/lib/use-geolocation";
import { haversineKm, formatDistanceShort } from "@/lib/geo";
import { POI_META, type PoiCategory, type PoiFeedItem } from "@/lib/types";

/**
 * Nearby services as a distance-sorted list.
 *
 * This is the primary way into a category: while walking, "what is
 * closest and how far" is the question being asked, and a list answers it
 * directly. The map is one tap away for anyone who wants spatial context.
 */
export function ServicesList({
  category,
  pois,
}: {
  category: PoiCategory;
  pois: PoiFeedItem[];
}) {
  const { position, loading, error } = useGeolocation();
  const meta = POI_META[category];

  const sorted = useMemo(() => {
    if (!position) return pois.map((p) => ({ poi: p, km: null as number | null }));
    return pois
      .map((p) => ({ poi: p, km: haversineKm(position, p) }))
      .sort((a, b) => a.km - b.km);
  }, [pois, position]);

  if (pois.length === 0) {
    return (
      <div className="flex flex-col items-center gap-stack-sm py-stack-lg text-center">
        <span
          className="material-symbols-outlined text-[40px] text-outline"
          aria-hidden="true"
        >
          {meta.icon}
        </span>
        <p className="text-body-lg text-on-surface-variant">
          No {meta.label.toLowerCase()} shared yet.
        </p>
        <Link
          href="/report"
          className="mt-stack-sm flex h-touch-target items-center gap-2 rounded-full bg-primary-container px-6 font-semibold text-on-primary-container active:scale-95"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            add_location_alt
          </span>
          Be the first to add one
        </Link>
      </div>
    );
  }

  return (
    <div className="py-stack-md">
      <p className="mb-stack-sm text-body-md text-on-surface-variant">
        {position
          ? `${sorted.length} nearby, closest first`
          : loading
            ? "Finding your location…"
            : (error ?? `${sorted.length} shared by kanwariyas`)}
      </p>

      <ul className="flex flex-col gap-stack-sm">
        {sorted.map(({ poi, km }) => (
          <li key={poi.id}>
            {/* Tapping opens this exact pin on the map. */}
            <Link
              href={`/map?category=${category}&poi=${poi.id}`}
              className="flex gap-3 rounded-xl border border-outline-variant/30 bg-surface p-3 active:scale-[0.99]"
            >
              {poi.photo_url ? (
                <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-surface-container">
                  <Image
                    src={poi.photo_url}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div
                  className="flex size-20 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${meta.pin}22` }}
                >
                  <span
                    className="material-symbols-outlined text-[28px]"
                    style={{ color: meta.pin }}
                    aria-hidden="true"
                  >
                    {meta.icon}
                  </span>
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-body-lg font-semibold text-on-surface">
                  {poi.title}
                </p>
                {poi.note && (
                  <p className="mt-0.5 line-clamp-2 text-body-md text-on-surface-variant">
                    {poi.note}
                  </p>
                )}
                <div className="mt-1.5 flex items-center gap-2">
                  {km !== null && (
                    <span className="flex items-center gap-1 rounded-full bg-primary-container/20 px-2 py-0.5 text-label-caps font-bold uppercase tracking-wide text-primary">
                      <span
                        className="material-symbols-outlined text-[14px]"
                        aria-hidden="true"
                      >
                        near_me
                      </span>
                      {formatDistanceShort(km)}
                    </span>
                  )}
                  <span className="truncate text-label-caps uppercase tracking-wide text-on-surface-variant">
                    {poi.submitted_by}
                  </span>
                </div>
              </div>

              <span
                className="material-symbols-outlined self-center text-outline"
                aria-hidden="true"
              >
                chevron_right
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
