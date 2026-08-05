import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { OfflineBanner } from "@/components/offline-banner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Yellow — Kanwar Yatra Companion",
  description:
    "Your companion for the Kanwar Yatra. Live distance tracking, bhojan shivirs, medical points and charging spots along the route — shared by fellow kanwariyas.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Yellow",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcf9f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0e14" },
  ],
  width: "device-width",
  initialScale: 1,
  // Users are walking and may need to zoom a map label; do not lock scale.
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        {/* Material Symbols, the icon set the Stitch designs use.
            Loaded here rather than via @import in globals.css: Turbopack
            strips a remote @import from the bundle without erroring,
            which silently turns every icon into raw text.
            eslint rules below target the pages/ router and don't apply
            to a <link> in an App Router root layout. */}
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col">
        {/* Sets the theme class before first paint so night walkers never
            get a flash of the white daylight UI. Mirrors resolveTheme()
            in theme-provider.tsx; runs before React hydrates, and touches
            only <html>, so it can't cause a hydration mismatch. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('yellow-theme');if(t!=='light'&&t!=='dark'){var h=new Date().getHours();t=(h>=19||h<5)?'dark':'light';}var e=document.documentElement;e.classList.toggle('dark',t==='dark');e.style.colorScheme=t;}catch(e){}})();`,
          }}
        />
        <ThemeProvider>
          <OfflineBanner />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
