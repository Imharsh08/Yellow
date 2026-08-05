import "server-only";

export interface GeocodeResult {
  name: string;
  area: string | null;
  lat: number;
  lng: number;
}

/**
 * Geocodes a free-text destination via Nominatim (OpenStreetMap).
 *
 * Runs server-side only. Nominatim's usage policy requires an
 * identifying User-Agent and at most 1 request/second, which is why this
 * is never called from the browser — a client-side call would fan out to
 * one request per user and get the app blocked.
 *
 * Results are biased to India and to the yatra corridor's bounding box,
 * since a bare temple name matches places worldwide.
 */
export async function geocodeDestination(
  query: string,
): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", trimmed);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "in");
  url.searchParams.set("addressdetails", "1");
  // Corridor bounding box (west,south,east,north), generously padded to
  // cover Delhi NCR, Haryana and western UP around the yatra routes.
  //
  // `bounded=1` is essential, not a nicety: without it Nominatim happily
  // returns same-name temples in other states — a bare "Pura Mahadev"
  // search resolves to Rajasthan, ~800km from the intended Baghpat
  // temple. Silently setting someone's destination there would corrupt
  // every distance the app shows them.
  url.searchParams.set("viewbox", "75.8,27.5,79.5,30.6");
  url.searchParams.set("bounded", "1");

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Yellow-KanwarYatra/1.0 (kanwar yatra companion app)",
        "Accept-Language": "en",
      },
      // Same query returns the same place; cache for a day to stay well
      // inside Nominatim's rate limit.
      next: { revalidate: 86_400 },
    });

    if (!res.ok) return [];

    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
      name?: string;
      address?: Record<string, string>;
    }>;

    return data
      .map((d) => {
        const lat = Number(d.lat);
        const lng = Number(d.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        // display_name is a long comma-joined path; the first segment is
        // the place and the next couple give useful locality context.
        const parts = d.display_name.split(",").map((p) => p.trim());
        const addr = d.address ?? {};
        const area =
          addr.city ??
          addr.town ??
          addr.state_district ??
          addr.county ??
          parts.slice(1, 3).join(", ") ??
          null;

        return {
          name: d.name?.trim() || parts[0],
          area: area || null,
          lat,
          lng,
        } satisfies GeocodeResult;
      })
      .filter((r): r is GeocodeResult => r !== null);
  } catch {
    // Network failure on a patchy connection is expected; the caller
    // shows the curated list instead of an error.
    return [];
  }
}
