"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// Shared show/hide-password field for the auth screens (login/signup) —
// same chrome-input token styling, just with a toggle button absolutely
// positioned inside the field rather than a separate control.
export function PasswordInput({
  value,
  onChange,
  required,
  minLength,
  autoFocus,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minLength?: number;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="chrome-input w-full pr-10"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-[var(--text-faint)] hover:text-[var(--text-muted)]"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
