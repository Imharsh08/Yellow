import type { Checkpoint } from "@/lib/types";

export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance in kilometres. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export interface RoutePosition {
  /** Index into the checkpoint array of the last milestone reached. */
  lastReachedSeq: number;
  /** Distance along the route from origin, in km. */
  kmCovered: number;
  /** Distance still to walk to the destination, in km. */
  kmRemaining: number;
  /** 0..1 fraction of the route completed. */
  progress: number;
  /** The next milestone to aim for, or null once finished. */
  nextCheckpoint: Checkpoint | null;
  /** Straight-line km to that next milestone. */
  kmToNextCheckpoint: number | null;
}

/**
 * Locates the walker along the route.
 *
 * Snaps to the nearest checkpoint rather than projecting onto road
 * geometry: the seeded route is a coarse polyline, so projection would
 * imply a precision the underlying data does not have. Progress is
 * therefore reported to the nearest milestone, which is what FR-8 needs.
 */
export function locateOnRoute(
  position: LatLng | null,
  checkpoints: Checkpoint[],
  totalKm: number,
): RoutePosition {
  const empty: RoutePosition = {
    lastReachedSeq: 0,
    kmCovered: 0,
    kmRemaining: totalKm,
    progress: 0,
    nextCheckpoint: checkpoints[0] ?? null,
    kmToNextCheckpoint: null,
  };

  if (!position || checkpoints.length === 0) return empty;

  const ordered = [...checkpoints].sort((a, b) => a.seq - b.seq);

  // Nearest checkpoint by straight-line distance.
  let nearest = ordered[0];
  let nearestKm = haversineKm(position, nearest);
  for (const cp of ordered) {
    const d = haversineKm(position, cp);
    if (d < nearestKm) {
      nearest = cp;
      nearestKm = d;
    }
  }

  const nearestIdx = ordered.findIndex((c) => c.seq === nearest.seq);
  const next = ordered[nearestIdx + 1] ?? null;

  // Interpolate between the nearest checkpoint and the next one so the
  // counter moves continuously while walking rather than jumping at
  // each milestone.
  let kmCovered = Number(nearest.km_from_start);
  if (next) {
    const legKm = Number(next.km_from_start) - Number(nearest.km_from_start);
    const toNext = haversineKm(position, next);
    const straightLeg = haversineKm(nearest, next);
    if (straightLeg > 0 && legKm > 0) {
      // Fraction of the leg already walked, clamped to the leg itself.
      const walked = Math.min(Math.max(1 - toNext / straightLeg, 0), 1);
      kmCovered += walked * legKm;
    }
  }

  kmCovered = Math.min(Math.max(kmCovered, 0), totalKm);
  const kmRemaining = Math.max(totalKm - kmCovered, 0);

  return {
    lastReachedSeq: nearest.seq,
    kmCovered,
    kmRemaining,
    progress: totalKm > 0 ? kmCovered / totalKm : 0,
    nextCheckpoint: next,
    kmToNextCheckpoint: next ? haversineKm(position, next) : null,
  };
}

/**
 * Approximate step count from distance.
 * FR-8 asks for "steps/km required"; 1400 steps/km reflects the ~0.71m
 * stride typical of sustained walking with a load.
 */
export function kmToSteps(km: number): number {
  return Math.round(km * 1400);
}

/**
 * Sustained walking pace on the yatra, in km/h.
 *
 * Deliberately below a fit walker's ~5 km/h: kanwariyas carry a kanwar,
 * walk in dense crowds, and stop at shivirs. 3.5 km/h is closer to what
 * the route actually yields over a full day, so the estimate doesn't
 * flatter and then disappoint.
 */
export const WALKING_KMH = 3.5;

/** Rough walking time for a distance, in minutes. */
export function kmToMinutes(km: number, kmh: number = WALKING_KMH): number {
  if (km <= 0 || kmh <= 0) return 0;
  return Math.round((km / kmh) * 60);
}

/**
 * Human-readable walking time: "40 min", "3 hr 20 min", "2 days 4 hr".
 *
 * Past ~10 walking hours it switches to days, assuming 8 hours of walking
 * per day — a multi-day figure like "36 hr" is not how anyone plans a
 * yatra.
 */
export function formatDuration(minutes: number): string {
  if (minutes < 1) return "Arrived";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours < 10) {
    return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
  }

  const WALKING_HOURS_PER_DAY = 8;
  const days = Math.floor(hours / WALKING_HOURS_PER_DAY);
  const restHours = hours % WALKING_HOURS_PER_DAY;

  if (days < 1) return `${hours} hr`;
  const dayLabel = days === 1 ? "1 day" : `${days} days`;
  return restHours > 0 ? `${dayLabel} ${restHours} hr` : dayLabel;
}

/** Convenience: walking time for a distance, already formatted. */
export function formatWalkingTime(km: number): string {
  return formatDuration(kmToMinutes(km));
}

export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/** Compact distance for dense list rows. */
export function formatDistanceShort(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 10) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
}
