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
      <header className="flex items-center justify-between border-b px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold" style={primaryColor ? { color: primaryColor } : undefined}>
          {logoUrl && <img src={logoUrl} alt="" className="h-6 w-6" />}
          {appName}
        </Link>
        <SignOutButton />
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>
    </div>
  );
}
