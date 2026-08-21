import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <Link href="/dashboard" className="font-semibold">
          OpenSite Studio
        </Link>
        <SignOutButton />
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>
    </div>
  );
}
