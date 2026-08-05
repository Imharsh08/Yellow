"use server";

import { createClient } from "@/lib/supabase/server";
import { geocodeDestination } from "@/lib/geocode";
import { haversineKm } from "@/lib/geo";
import { YATRA_ORIGIN } from "@/lib/generate-route";

export interface DestinationOption {
  /** Present for saved destinations; absent for fresh geocode hits. */
  id: string | null;
  name: string;
  area: string | null;
  description: string | null;
  lat: number;
  lng: number;
  isPopular: boolean;
  /** Straight-line km from Haridwar, for a rough sense of scale. */
  kmFromOrigin: number;
}

/**
 * Searches saved destinations first, then falls back to geocoding.
 *
 * Saved rows are preferred so a place several walkers have chosen keeps
 * one identity (and its curated description) instead of spawning a new
 * geocoded row each time someone types it.
 */
export async function searchDestinations(
  query: string,
): Promise<DestinationOption[]> {
  const trimmed = query.trim();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  if (trimmed.length < 2) {
    const { data } = await supabase
      .from("destinations")
      .select("*")
      .eq("is_popular", true)
      .order("name");
    return (data ?? []).map(toOption);
  }

  const { data: saved } = await supabase
    .from("destinations")
    .select("*")
    .or(`name.ilike.%${trimmed}%,area.ilike.%${trimmed}%`)
    .limit(8);

  const results = (saved ?? []).map(toOption);
  if (results.length >= 5) return results;

  // Not enough saved matches — ask Nominatim, dropping anything already
  // shown so the list doesn't repeat itself.
  const geocoded = await geocodeDestination(trimmed);
  const seen = new Set(results.map((r) => r.name.toLowerCase()));

  for (const g of geocoded) {
    if (seen.has(g.name.toLowerCase())) continue;
    results.push({
      id: null,
      name: g.name,
      area: g.area,
      description: null,
      lat: g.lat,
      lng: g.lng,
      isPopular: false,
      kmFromOrigin: haversineKm(YATRA_ORIGIN, g),
    });
  }

  return results;
}

function toOption(d: {
  id: string;
  name: string;
  area: string | null;
  description: string | null;
  lat: number;
  lng: number;
  is_popular: boolean;
}): DestinationOption {
  return {
    id: d.id,
    name: d.name,
    area: d.area,
    description: d.description,
    lat: d.lat,
    lng: d.lng,
    isPopular: d.is_popular,
    kmFromOrigin: haversineKm(YATRA_ORIGIN, { lat: d.lat, lng: d.lng }),
  };
}
