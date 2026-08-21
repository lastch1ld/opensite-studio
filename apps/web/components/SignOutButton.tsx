"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-sm text-gray-600 underline">
      Log out
    </button>
  );
}
