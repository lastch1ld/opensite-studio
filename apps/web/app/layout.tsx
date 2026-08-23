import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk, Fraunces, Instrument_Serif, IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { getAppSettings } from "@/lib/appSettings";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Self-hosted via next/font (no external font requests at runtime — the
// files are bundled at build time) rather than a Google Fonts <link>, so
// this doesn't add a third-party network dependency to published sites.
// A small, deliberately varied set — one geometric-sans, one high-contrast
// serif, one classical serif, one mono, one rounded-humanist-sans — so the
// preset sections (docs/ui-ux-roadmap.md) and any block's own "Font"
// field (components/blocks/registry.tsx) can pair a distinctive display
// face against the body default instead of every site looking like the
// same system-font page. Adding more later just means adding another
// import + CSS variable here and a matching option in FONT_FIELD.
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });
const instrumentSerif = Instrument_Serif({ variable: "--font-instrument-serif", subsets: ["latin"], weight: "400" });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500", "600"] });
const jakartaSans = Plus_Jakarta_Sans({ variable: "--font-jakarta-sans", subsets: ["latin"] });

// Fallback title/favicon only — every public site route (app/(public)/**)
// overrides title via its own generateMetadata, so this default only shows
// on the dashboard/auth chrome, matching docs/ai-mode.md's whitelabeling
// scope (dashboard shell, login/signup — not per-site).
const { appName, faviconUrl } = getAppSettings();

export const metadata: Metadata = {
  title: appName,
  description: "Self-hosted visual site builder",
  icons: faviconUrl ? { icon: faviconUrl } : undefined,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${fraunces.variable} ${instrumentSerif.variable} ${plexMono.variable} ${jakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
