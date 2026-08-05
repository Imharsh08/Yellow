"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", icon: "home", label: "Home" },
  { href: "/map", icon: "map", label: "Map" },
  { href: "/feed", icon: "dynamic_feed", label: "Feed" },
  { href: "/roadmap", icon: "route", label: "Roadmap" },
  { href: "/profile", icon: "person", label: "Profile" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-50 flex h-[72px] items-center gap-1 rounded-t-xl bg-surface px-2 pb-safe shadow-[0_-2px_10px_rgba(255,153,51,0.15)]"
    >
      {ITEMS.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex h-14 min-w-0 flex-1 flex-col items-center justify-center rounded-full transition-transform duration-200 active:scale-90 ${
              active
                ? "bg-primary-container text-on-primary-container"
                : "text-on-surface-variant"
            }`}
          >
            <span
              className={`material-symbols-outlined ${active ? "icon-filled" : ""}`}
              aria-hidden="true"
            >
              {item.icon}
            </span>
            <span className="mt-0.5 w-full truncate px-1 text-center text-[10px] font-bold uppercase tracking-wide">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
