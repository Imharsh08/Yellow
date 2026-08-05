"use client";

import { useEffect, useState, useTransition } from "react";
import {
  searchDestinations,
  type DestinationOption,
} from "@/app/onboarding/search-destinations";
import { formatKm, formatWalkingTime } from "@/lib/geo";

/**
 * Destination picker (FR-3).
 *
 * Popular temples are shown as cards with distance and walking time from
 * Haridwar, so the choice carries a sense of commitment rather than being
 * a bare name. Anything else is found by typing, which falls back to
 * geocoding when the saved list has no match.
 */
export function DestinationPicker({
  popular,
  onSelect,
  selected,
}: {
  popular: DestinationOption[];
  onSelect: (d: DestinationOption | null) => void;
  selected: DestinationOption | null;
}) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<DestinationOption[] | null>(null);
  const [searching, startSearch] = useTransition();

  const isSearch = query.trim().length >= 2;

  // Derived, not stored: a short query always shows the curated list, so
  // there is nothing to synchronise.
  const results = isSearch ? (matches ?? []) : popular;
  const searched = isSearch && matches !== null;

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    // Debounced: Nominatim allows ~1 request/second, and this fires as
    // the user types.
    const timer = setTimeout(() => {
      startSearch(async () => {
        setMatches(await searchDestinations(trimmed));
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  if (selected) {
    return (
      <div className="rounded-lg border-2 border-primary-container bg-primary-container/10 p-4">
        <div className="flex items-start gap-3">
          <span
            className="material-symbols-outlined icon-filled text-primary"
            aria-hidden="true"
          >
            temple_hindu
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-body-lg font-semibold text-on-surface">
              {selected.name}
            </p>
            {selected.area && (
              <p className="text-body-md text-on-surface-variant">
                {selected.area}
              </p>
            )}
            <p className="mt-1 text-body-md font-semibold text-primary">
              ~{formatKm(selected.kmFromOrigin)} from Haridwar ·{" "}
              {formatWalkingTime(selected.kmFromOrigin)} walking
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setQuery("");
            }}
            className="text-body-md font-semibold text-primary underline"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="destination-search" className="sr-only">
        Search for your destination
      </label>
      <div className="relative">
        <span
          className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
          aria-hidden="true"
        >
          search
        </span>
        <input
          id="destination-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a temple, town or place"
          className="h-touch-target w-full rounded-lg border border-outline-variant bg-surface-container-lowest pl-11 pr-4 text-body-lg text-on-surface outline-none placeholder:text-on-surface-variant/50 focus:ring-[3px] focus:ring-primary-container"
        />
      </div>

      <p className="mt-stack-sm text-label-caps uppercase tracking-wide text-on-surface-variant">
        {!isSearch
          ? "Popular destinations"
          : searching || !searched
            ? "Searching…"
            : `${results.length} found`}
      </p>

      <ul className="mt-2 flex flex-col gap-2">
        {results.map((d) => (
          <li key={d.id ?? `${d.lat},${d.lng}`}>
            <button
              type="button"
              onClick={() => onSelect(d)}
              className="flex w-full items-start gap-3 rounded-lg border border-outline-variant/60 bg-surface p-3 text-left active:scale-[0.99]"
            >
              <span
                className="material-symbols-outlined mt-0.5 text-primary"
                aria-hidden="true"
              >
                {d.isPopular ? "temple_hindu" : "location_on"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-body-lg font-semibold text-on-surface">
                  {d.name}
                </span>
                {d.area && (
                  <span className="block text-body-md text-on-surface-variant">
                    {d.area}
                  </span>
                )}
                {d.description && (
                  <span className="mt-1 block line-clamp-2 text-body-md text-on-surface-variant">
                    {d.description}
                  </span>
                )}
                <span className="mt-1 block text-label-caps uppercase tracking-wide text-primary">
                  ~{formatKm(d.kmFromOrigin)} from Haridwar
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {searched && results.length === 0 && !searching && (
        <p className="mt-stack-sm rounded-lg bg-surface-container-low p-4 text-body-md text-on-surface-variant">
          Nothing found for &ldquo;{query.trim()}&rdquo;. Try a nearby town or
          landmark name.
        </p>
      )}
    </div>
  );
}
