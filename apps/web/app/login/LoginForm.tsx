"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PasswordInput } from "@/components/PasswordInput";

export function LoginForm({ appName }: { appName: string }) {
  return (
    <Suspense>
      <LoginFormInner appName={appName} />
    </Suspense>
  );
}

function LoginFormInner({ appName }: { appName: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push(searchParams.get("callbackUrl") || "/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="chrome-card w-full max-w-sm p-8">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--text)]">Log in to {appName}</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Welcome back — enter your details to continue.</p>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <div>
            <label className="chrome-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="chrome-input w-full"
            />
          </div>
          <div>
            <label className="chrome-label">Password</label>
            <PasswordInput value={password} onChange={setPassword} required />
          </div>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button type="submit" disabled={loading} className="chrome-btn chrome-btn-primary mt-1 w-full py-2.5">
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-[var(--text-muted)]">
          No account?{" "}
          <Link href="/signup" className="font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
