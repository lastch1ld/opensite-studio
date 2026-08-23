import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import { getAppSettings } from "@/lib/appSettings";

// CMS-chrome whitelabeling (docs/ai-mode.md) — app name/logo/accent color
// read from env vars, applied to the dashboard shell here plus login/signup.
// Deliberately instance-level, not per-site.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { appName, logoUrl, primaryColor } = getAppSettings();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-[15px] font-semibold tracking-tight"
            style={primaryColor ? { color: primaryColor } : undefined}
          >
            {logoUrl && <img src={logoUrl} alt="" className="h-6 w-6 rounded" />}
            {appName}
          </Link>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
