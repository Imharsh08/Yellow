"use client";

import { useEffect, useRef, useState } from "react";
import type { LatLng } from "@/lib/geo";

const CACHE_KEY = "yellow-last-position";

const EMPTY_STATE: GeoState = {
  position: null,
  accuracy: null,
  error: null,
  loading: true,
  stale: false,
};

/**
 * Reads the last cached fix. Browser-only — never call during render, or
 * the server and client produce different markup.
 */
function readCachedPosition(): LatLng | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as LatLng;
    if (typeof cached?.lat !== "number" || typeof cached?.lng !== "number") {
      return null;
    }
    return cached;
  } catch {
    // Corrupt cache is not worth surfacing; a live fix will replace it.
    return null;
  }
}

export interface GeoState {
  position: LatLng | null;
  accuracy: number | null;
  error: string | null;
  /** True while waiting on the very first fix. */
  loading: boolean;
  /** Position came from cache, not a live fix — signal may be down. */
  stale: boolean;
}

/**
 * Watches device position for the distance tracker (FR-2, FR-7).
 *
 * Caches the last fix to localStorage so the dashboard can render
 * immediately on a dead-signal stretch instead of showing nothing
 * (NFR §7: "cache last known route state").
 */
export function useGeolocation(enabled = true): GeoState {
  // Always starts empty so the server-rendered markup and the client's
  // first render agree. localStorage and `navigator` are read in the
  // effect below, after hydration — reading them during render caused a
  // hydration mismatch ("Finding your location…" vs "Last known position").
  const [state, setState] = useState<GeoState>(EMPTY_STATE);
  const watchId = useRef<number | null>(null);

  /* These two setState calls read browser-only APIs (`navigator` and
     localStorage) that cannot be touched during render without breaking
     hydration. That is precisely the "synchronise with an external
     system" case effects exist for, so the rule is disabled here
     deliberately rather than worked around. */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!enabled) return;

    if (!("geolocation" in navigator)) {
      setState({
        ...EMPTY_STATE,
        loading: false,
        error: "Location isn't available on this device.",
      });
      return;
    }

    // Paint the cached fix immediately so the counter is never blank on a
    // cold, signal-less start, then let the live watch replace it.
    const cached = readCachedPosition();
    if (cached) {
      setState((s) =>
        s.position ? s : { ...s, position: cached, stale: true },
      );
    }

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const next = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        try {
          window.localStorage.setItem(CACHE_KEY, JSON.stringify(next));
        } catch {
          // Private mode / quota — tracking still works for this session.
        }
        setState({
          position: next,
          accuracy: pos.coords.accuracy,
          error: null,
          loading: false,
          stale: false,
        });
      },
      (err) => {
        setState((s) => ({
          ...s,
          loading: false,
          error:
            err.code === err.PERMISSION_DENIED
              ? "Location permission is off. Turn it on to track your walk."
              : "Couldn't get your location. Check your signal.",
        }));
      },
      {
        enableHighAccuracy: true,
        // 30s cache and a generous timeout: on a walk, a fix a few seconds
        // old is fine, and hammering GPS is the main battery risk flagged
        // in the BRD's risk register (§11).
        maximumAge: 30_000,
        timeout: 20_000,
      },
    );

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [enabled]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return state;
}
