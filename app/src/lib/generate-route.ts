import { haversineKm, type LatLng } from "@/lib/geo";

/** Har Ki Pauri, Haridwar — where the yatra water is collected. */
export const YATRA_ORIGIN = {
  name: "Har Ki Pauri, Haridwar",
  lat: 29.9384473,
  lng: 78.1452985,
};

/**
 * Named waypoints along the NH-58 corridor south from Haridwar.
 *
 * Every popular destination lies on or beyond this spine, so a generated
 * route follows it as far as it usefully can before striking out toward
 * the destination. That keeps custom routes anchored to real towns
 * instead of drawing a bare line across the map.
 *
 * Same caveat as the seeded route: these are real town coordinates, but
 * the path between them is not surveyed road geometry.
 */
const CORRIDOR: Array<{ name: string; lat: number; lng: number }> = [
  { name: "Har Ki Pauri, Haridwar", lat: 29.9384473, lng: 78.1452985 },
  { name: "Bahadrabad", lat: 29.9197264, lng: 78.0436674 },
  { name: "Roorkee", lat: 29.8693496, lng: 77.8902124 },
  { name: "Manglaur", lat: 29.7921496, lng: 77.8760645 },
  { name: "Muzaffarnagar", lat: 29.4496979, lng: 77.7429333 },
  { name: "Khatauli", lat: 29.2738601, lng: 77.7374607 },
  { name: "Meerut", lat: 29.0018557, lng: 77.7679671 },
];

/**
 * Straight-line distance underestimates road distance. Comparing the
 * seeded chain (124.7km straight) against the real ~150km NH-58 road
 * distance gives this factor, which is applied to generated routes so
 * their kilometre figures are comparable to the curated one.
 */
const ROAD_FACTOR = 1.2032;

/** Target spacing between milestones — FR-8 asks for every 5-10km. */
const TARGET_SPACING_KM = 7;

export interface GeneratedCheckpoint {
  seq: number;
  name: string;
  lat: number;
  lng: number;
  km_from_start: number;
  notes: string | null;
}

export interface GeneratedRoute {
  originName: string;
  originLat: number;
  originLng: number;
  totalKm: number;
  checkpoints: GeneratedCheckpoint[];
}

/**
 * Builds a milestone chain from Haridwar to an arbitrary destination.
 *
 * Follows the corridor while it still makes progress toward the target,
 * then runs direct. Corridor towns are kept as named milestones; the
 * points between them are interpolated and labelled as such.
 */
export function generateRoute(
  destination: { name: string; lat: number; lng: number },
  spacingKm: number = TARGET_SPACING_KM,
): GeneratedRoute {
  const dest: LatLng = { lat: destination.lat, lng: destination.lng };

  // Keep corridor towns only while each one brings us meaningfully closer
  // to the destination. The 5km margin stops the chain from tacking on a
  // town that barely helps — without it, a destination west of the
  // corridor (Baghpat) routes all the way south to Meerut before turning
  // back north-west, which is not how anyone walks it.
  const MIN_GAIN_KM = 5;
  const spine: typeof CORRIDOR = [CORRIDOR[0]];
  for (let i = 1; i < CORRIDOR.length; i++) {
    const prev = spine[spine.length - 1];
    const gain = haversineKm(prev, dest) - haversineKm(CORRIDOR[i], dest);
    if (gain > MIN_GAIN_KM) spine.push(CORRIDOR[i]);
  }

  // Final leg from the last useful corridor town to the destination.
  const legs = [...spine, { ...destination }];

  const checkpoints: GeneratedCheckpoint[] = [
    {
      seq: 0,
      name: legs[0].name,
      lat: legs[0].lat,
      lng: legs[0].lng,
      km_from_start: 0,
      notes: "Start",
    },
  ];

  let cumulativeKm = 0;
  let seq = 1;

  for (let i = 1; i < legs.length; i++) {
    const from = legs[i - 1];
    const to = legs[i];
    const legKm = haversineKm(from, to) * ROAD_FACTOR;

    // Skip degenerate legs — e.g. a destination sitting on a corridor town.
    if (legKm < 0.5) continue;

    const steps = Math.max(1, Math.round(legKm / spacingKm));
    const isFinalLeg = i === legs.length - 1;

    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const atEnd = s === steps;
      cumulativeKm += legKm / steps;

      checkpoints.push({
        seq: seq++,
        name: atEnd ? to.name : `Towards ${to.name}`,
        lat: round6(from.lat + (to.lat - from.lat) * t),
        lng: round6(from.lng + (to.lng - from.lng) * t),
        km_from_start: Math.round(cumulativeKm * 100) / 100,
        notes: atEnd ? (isFinalLeg ? "Destination" : "Major stop") : null,
      });
    }
  }

  return {
    originName: legs[0].name,
    originLat: legs[0].lat,
    originLng: legs[0].lng,
    totalKm: Math.round(cumulativeKm * 100) / 100,
    checkpoints,
  };
}

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
