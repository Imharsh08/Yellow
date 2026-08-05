"use client";

import { useEffect, useRef, useState } from "react";
import type { LatLng } from "@/lib/geo";

const CACHE_KEY = "yellow-last-position";

function readCachedState(): GeoState {
  const empty: GeoState = {
    position: null,
    accuracy: null,
    error: null,
    loading: true,
    stale: false,
  };

  if (typeof window === "undefined") return empty;

  if (!("geolocation" in navigator)) {
    return {
      ...empty,
      loading: false,
      error: "Location isn't available on this device.",
    };
  }

  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return empty;
    const cached = JSON.parse(raw) as LatLng;
    if (typeof cached?.lat !== "number" || typeof cached?.lng !== "number") {
      return empty;
    }
    return { ...empty, position: cached, stale: true };
  } catch {
    // Corrupt cache is not worth surfacing; a live fix will replace it.
    return empty;
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
  // Seed from the cached fix in a lazy initialiser so the counter is
  // never blank on a cold, signal-less start, without a setState in the
  // effect body.
  const [state, setState] = useState<GeoState>(readCachedState);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Device support is known at init time, so it is resolved in the
    // initialiser rather than here.
    if (!("geolocation" in navigator)) return;

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

  return state;
}
