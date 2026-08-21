import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
