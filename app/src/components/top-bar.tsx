"use client";

import { useTheme } from "@/components/theme-provider";

export function TopBar({ title = "Yellow" }: { title?: string }) {
  const { theme, toggle } = useTheme();

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-touch-target items-center justify-between bg-surface px-margin-mobile shadow-sm">
      <span
        className="material-symbols-outlined icon-filled text-primary-container"
        aria-hidden="true"
      >
        footprint
      </span>

      <h1 className="flex-1 text-center text-[22px] font-bold tracking-tight text-primary-container">
        {title}
      </h1>

      <button
        onClick={toggle}
        aria-label={
          theme === "light"
            ? "Switch to night walking mode"
            : "Switch to day mode"
        }
        className="flex size-10 items-center justify-center rounded-full text-primary transition-transform duration-200 active:scale-95"
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          {theme === "light" ? "dark_mode" : "light_mode"}
        </span>
      </button>
    </header>
  );
}
