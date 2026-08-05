"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggle: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const STORAGE_KEY = "yellow-theme";

function resolveInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;

  const hour = new Date().getHours();
  return hour >= 19 || hour < 5 ? "dark" : "light";
}

/**
 * Light/dark toggle for Night Walking mode.
 *
 * Defaults to dark between 19:00 and 05:00 — the yatra is largely walked
 * at night, and a blinding white screen in the dark is a real hazard.
 * An explicit choice always wins over the time heuristic.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Resolved in a lazy initialiser rather than an effect so the first
  // paint already carries the right theme (no flash of the wrong mode).
  // SSR has no `window`, so it starts light and syncs on mount below.
  const [theme, setTheme] = useState<Theme>(resolveInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
