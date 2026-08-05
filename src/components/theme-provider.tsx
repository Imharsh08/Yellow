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

/** Browser-only. Never call during render — it would break hydration. */
function resolveTheme(): Theme {
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
  // Starts "light" on both server and client so hydration matches, then
  // resolves the stored/time-based preference on mount. The inline script
  // in layout.tsx has already set the correct class on <html>, so there is
  // no flash of the wrong theme despite this starting light.
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(resolveTheme());
  }, []);

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
