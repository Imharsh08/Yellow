"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
// MapLibre 6 ships named exports only — there is no default export.
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useGeolocation } from "@/lib/use-geolocation";
import { haversineKm, type LatLng } from "@/lib/geo";
import { POI_META, POI_CATEGORIES, type PoiCategory, type PoiFeedItem } from "@/lib/types";
import { PoiDetailSheet } from "@/components/poi-detail-sheet";

// Vlogs are stories rather than places, so they live in /feed and are
// neither fetched for nor filterable on the map.
const MAP_CATEGORIES = POI_CATEGORIES.filter((c) => c !== "personal_vlog");

/**
 * Public map (FR-5).
 *
 * Uses MapLibre with OpenStreetMap raster tiles: no API key, no billing
 * account, no vendor sign-up needed to launch. Swap `style` for a Google
 * or Mapbox style later without touching the rest of this component.
 */
export function MapView({
  pois,
  initialCategory,
  focusPoiId,
  currentUserId,
  fallbackCenter,
}: {
  pois: PoiFeedItem[];
  initialCategory: PoiCategory | null;
  focusPoiId?: string | null;
  currentUserId: string;
  fallbackCenter: LatLng;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const userMarker = useRef<maplibregl.Marker | null>(null);
  const didCenter = useRef(false);

  const { position } = useGeolocation();
  const [active, setActive] = useState<PoiCategory | null>(initialCategory);
  // Arriving from the services list with ?poi=<id> opens that pin's sheet
  // straight away, so it's seeded here rather than set from an effect.
  const [selected, setSelected] = useState<PoiFeedItem | null>(
    () => pois.find((p) => p.id === focusPoiId) ?? null,
  );
  const [ready, setReady] = useState(false);

  const visible = useMemo(
    () => (active ? pois.filter((p) => p.category === active) : pois),
    [pois, active],
  );

  // --- init map once ---
  useEffect(() => {
    if (!container.current || map.current) return;

    map.current = new maplibregl.Map({
      container: container.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      center: [fallbackCenter.lng, fallbackCenter.lat],
      zoom: 11,
      attributionControl: false,
    });

    map.current.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-left",
    );
    map.current.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );

    map.current.on("load", () => setReady(true));

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [fallbackCenter.lat, fallbackCenter.lng]);

  // --- arriving from the services list: fly to that pin ---
  useEffect(() => {
    if (!map.current || !ready || !focusPoiId) return;

    const target = pois.find((p) => p.id === focusPoiId);
    if (!target) return;

    // Claim the centring slot so the user's own location doesn't yank the
    // viewport away from the pin they explicitly chose.
    didCenter.current = true;
    map.current.flyTo({
      center: [target.lng, target.lat],
      zoom: 15,
      duration: 1000,
    });
  }, [focusPoiId, pois, ready]);

  // --- centre on the walker once we have a fix ---
  useEffect(() => {
    if (!map.current || !position || didCenter.current) return;
    didCenter.current = true;
    map.current.flyTo({
      center: [position.lng, position.lat],
      zoom: 13,
      duration: 1200,
    });
  }, [position]);

  // --- the walker's own dot ---
  useEffect(() => {
    if (!map.current || !position || !ready) return;

    if (!userMarker.current) {
      const el = document.createElement("div");
      el.className =
        "size-4 rounded-full bg-blue-500 border-2 border-white shadow-lg";
      el.setAttribute("aria-label", "Your location");
      userMarker.current = new maplibregl.Marker({ element: el })
        .setLngLat([position.lng, position.lat])
        .addTo(map.current);
    } else {
      userMarker.current.setLngLat([position.lng, position.lat]);
    }
  }, [position, ready]);

  // --- POI pins ---
  useEffect(() => {
    if (!map.current || !ready) return;

    markers.current.forEach((m) => m.remove());
    markers.current = [];

    for (const poi of visible) {
      const meta = POI_META[poi.category];

      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", `${meta.label}: ${poi.title}`);
      el.style.cssText = `
        width:34px;height:34px;border-radius:9999px;
        background:${meta.pin};border:3px solid #fff;
        box-shadow:0 2px 8px rgba(0,0,0,.35);
        display:flex;align-items:center;justify-content:center;
        cursor:pointer;padding:0;`;

      const icon = document.createElement("span");
      icon.className = "material-symbols-outlined icon-filled";
      icon.style.cssText = "font-size:18px;color:#fff;";
      icon.textContent = meta.icon;
      el.appendChild(icon);

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setSelected(poi);
      });

      markers.current.push(
        new maplibregl.Marker({ element: el })
          .setLngLat([poi.lng, poi.lat])
          .addTo(map.current!),
      );
    }
  }, [visible, ready]);

  return (
    <div className="fixed inset-0 bottom-[72px]">
      <div ref={container} className="size-full" />

      {/* Category filters (FR-5) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-3">
        <div className="pointer-events-auto flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FilterChip
            label="All"
            icon="apps"
            active={active === null}
            onClick={() => setActive(null)}
          />
          {MAP_CATEGORIES.map((c) => (
            <FilterChip
              key={c}
              label={POI_META[c].label}
              icon={POI_META[c].icon}
              active={active === c}
              onClick={() => setActive(active === c ? null : c)}
            />
          ))}
        </div>
      </div>

      {/* Recentre */}
      {position && (
        <button
          onClick={() =>
            map.current?.flyTo({
              center: [position.lng, position.lat],
              zoom: 14,
            })
          }
          aria-label="Centre on my location"
          className="absolute bottom-28 right-4 z-10 flex size-12 items-center justify-center rounded-full bg-surface shadow-lg active:scale-95"
        >
          <span className="material-symbols-outlined text-primary" aria-hidden="true">
            my_location
          </span>
        </button>
      )}

      {/* Add POI (FR-4) */}
      <Link
        href="/report"
        className="absolute bottom-6 right-4 z-10 flex h-touch-target items-center gap-2 rounded-full bg-primary-container px-6 font-semibold text-on-primary-container shadow-[0_4px_24px_rgba(255,153,51,0.45)] active:scale-95"
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          add_location_alt
        </span>
        Add a point
      </Link>

      {visible.length === 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-24 z-10 flex justify-center px-6">
          <p className="rounded-full bg-surface/95 px-4 py-2 text-center text-body-md text-on-surface-variant shadow">
            {active
              ? `No ${POI_META[active].label.toLowerCase()} pins yet — be the first to add one.`
              : "No points yet. Add the first one to help others."}
          </p>
        </div>
      )}

      {selected && (
        <PoiDetailSheet
          poi={selected}
          currentUserId={currentUserId}
          distanceKm={
            position ? haversineKm(position, selected) : null
          }
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function FilterChip({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-body-md font-semibold shadow-md transition-colors ${
        active
          ? "bg-primary-container text-on-primary-container"
          : "bg-surface text-on-surface-variant"
      }`}
    >
      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
        {icon}
      </span>
      {label}
    </button>
  );
}
