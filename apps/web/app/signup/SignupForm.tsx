"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PasswordInput } from "@/components/PasswordInput";

export function SignupForm({ appName }: { appName: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("Account created, but login failed. Try logging in.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="chrome-card w-full max-w-sm p-8">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--text)]">Sign up for {appName}</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Create an account to start building sites.</p>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <div>
            <label className="chrome-label">Name (optional)</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus className="chrome-input w-full" />
          </div>
          <div>
            <label className="chrome-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="chrome-input w-full"
            />
          </div>
          <div>
            <label className="chrome-label">Password (min 8 characters)</label>
            <PasswordInput value={password} onChange={setPassword} required minLength={8} />
          </div>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button type="submit" disabled={loading} className="chrome-btn chrome-btn-primary mt-1 w-full py-2.5">
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-[var(--text-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
