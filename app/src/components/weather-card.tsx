"use client";

import { useEffect, useState } from "react";
import type { LatLng } from "@/lib/geo";

interface Weather {
  temp: number;
  feelsLike: number;
  code: number;
  rainChance: number;
}

/**
 * FR-9: location-based weather, framed for trip decisions.
 *
 * Open-Meteo needs no API key and no billing account, which is why it is
 * used here. Surfaces "feels like" rather than raw temperature, and calls
 * out heat/rain explicitly — on this route those drive when you rest and
 * when you walk.
 */
export function WeatherCard({ position }: { position: LatLng | null }) {
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    if (!position) return;
    const controller = new AbortController();

    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${position.lat.toFixed(3)}` +
      `&longitude=${position.lng.toFixed(3)}` +
      `&current=temperature_2m,apparent_temperature,weather_code` +
      `&daily=precipitation_probability_max&timezone=auto&forecast_days=1`;

    fetch(url, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("weather"))))
      .then((d) =>
        setWeather({
          temp: Math.round(d.current.temperature_2m),
          feelsLike: Math.round(d.current.apparent_temperature),
          code: d.current.weather_code,
          rainChance: d.daily?.precipitation_probability_max?.[0] ?? 0,
        }),
      )
      .catch(() => {
        // Weather is supplementary — a failure must never block the tracker.
      });

    return () => controller.abort();
  }, [position]);

  if (!weather) return null;

  const { icon, label } = describe(weather.code);

  // Advice is the point of this card, not the number (BRD §2: "framed to
  // help users time rest stops and departure").
  const advice =
    weather.feelsLike >= 38
      ? "Very hot — rest in shade, drink often"
      : weather.rainChance >= 60
        ? "Rain likely — keep your kanwar covered"
        : weather.feelsLike >= 33
          ? "Warm — carry water"
          : "Good walking weather";

  return (
    <div className="absolute right-4 top-4 flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5 rounded-full border border-outline-variant/20 bg-surface-container-low px-3 py-1.5 shadow-sm">
        <span
          className="material-symbols-outlined icon-filled text-[16px] text-tertiary-container"
          aria-hidden="true"
        >
          {icon}
        </span>
        <span className="text-label-caps font-bold uppercase tracking-wide text-on-surface-variant">
          {weather.temp}°C, {label}
        </span>
      </div>
      <span className="max-w-[9rem] text-right text-[11px] leading-tight text-on-surface-variant">
        {advice}
      </span>
    </div>
  );
}

/** WMO weather codes → Material Symbol + short label. */
function describe(code: number): { icon: string; label: string } {
  if (code === 0) return { icon: "sunny", label: "Clear" };
  if (code <= 2) return { icon: "partly_cloudy_day", label: "Partly cloudy" };
  if (code === 3) return { icon: "cloud", label: "Cloudy" };
  if (code <= 48) return { icon: "foggy", label: "Fog" };
  if (code <= 57) return { icon: "rainy", label: "Drizzle" };
  if (code <= 67) return { icon: "rainy", label: "Rain" };
  if (code <= 77) return { icon: "weather_snowy", label: "Snow" };
  if (code <= 82) return { icon: "rainy", label: "Showers" };
  if (code <= 86) return { icon: "weather_snowy", label: "Snow" };
  return { icon: "thunderstorm", label: "Storm" };
}
