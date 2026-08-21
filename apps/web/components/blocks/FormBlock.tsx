"use client";

import { useState } from "react";
import type { FormBlockProps, FormField } from "./types";
import { evaluateCondition, type Condition } from "@/lib/condition";
import type { RenderContext } from "@/lib/bind";

// `onSubmit` (the storeOnly/webhook/email dispatch config) is only relevant
// server-side, so the render component doesn't need it as a prop.
type FormBlockRenderProps = Omit<FormBlockProps, "onSubmit"> & {
  blockId: string;
  ctx: RenderContext;
};

function fieldVisible(field: FormField, values: Record<string, unknown>, ctx: RenderContext): boolean {
  if (!field.showIf) return true;
  // Reuses the same Condition engine as block visibility/Template targeting
  // (lib/condition.ts), but a form field's showIf is evaluated against the
  // in-progress answers, not the page's RenderContext — so it's checked
  // here directly rather than through evaluateCondition's collection-bound
  // branches, except for the one shape that does apply generically.
  return evaluateFieldCondition(field.showIf, values, ctx);
}

// Field-level conditions only make sense as "another field in this form
// equals X" (collectionFieldEquals reinterpreted: field -> answer key), plus
// the generic device/boolean combinators which stay meaningful as-is.
function evaluateFieldCondition(condition: Condition, values: Record<string, unknown>, ctx: RenderContext): boolean {
  switch (condition.type) {
    case "always":
      return true;
    case "deviceIs":
      return evaluateCondition(condition, ctx);
    case "collectionFieldEquals":
      return values[condition.field] === condition.value;
    case "and":
      return condition.conditions.every((c) => evaluateFieldCondition(c, values, ctx));
    case "or":
      return condition.conditions.some((c) => evaluateFieldCondition(c, values, ctx));
    default:
      return true;
  }
}

function FieldWidget({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const commonClass = "w-full rounded border px-3 py-2 text-sm";
  switch (field.type) {
    case "textarea":
      return (
        <textarea
          required={field.required}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className={commonClass}
        />
      );
    case "select":
      return (
        <select
          required={field.required}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className={commonClass}
        >
          <option value="">Select...</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    case "radio":
      return (
        <div className="flex flex-col gap-1">
          {(field.options ?? []).map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={field.id}
                required={field.required}
                checked={value === opt}
                onChange={() => onChange(opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      );
    case "checkbox":
      return (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          {field.label}
        </label>
      );
    case "file":
      return (
        <input
          type="file"
          required={field.required}
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          className={commonClass}
        />
      );
    case "email":
      return (
        <input
          type="email"
          required={field.required}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className={commonClass}
        />
      );
    default:
      return (
        <input
          type="text"
          required={field.required}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className={commonClass}
        />
      );
  }
}

// Renders + submits docs/forms.md's `form` block. Multi-step is a purely
// client-side presentation concern over one field list and one submission
// (`steps` groups which field ids show together) — not a sequence of
// separate forms.
export function FormBlock({ fields, steps, submitLabel, blockId, ctx }: FormBlockRenderProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const hasSteps = Boolean(steps && steps.length > 0);
  const stepFieldIds = hasSteps ? steps![step] ?? [] : fields.map((f) => f.id);
  const visibleFields = fields.filter((f) => stepFieldIds.includes(f.id) && fieldVisible(f, values, ctx));
  const isLastStep = !hasSteps || step === steps!.length - 1;

  function updateValue(fieldId: string, v: unknown) {
    setValues((prev) => ({ ...prev, [fieldId]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLastStep) {
      setStep((s) => s + 1);
      return;
    }
    if (!ctx.siteId || !ctx.pageId) {
      setStatus("error");
      setError("This form can't be submitted from a preview.");
      return;
    }
    setStatus("submitting");
    setError(null);

    const plainData: Record<string, unknown> = {};
    const body = new FormData();
    for (const [key, v] of Object.entries(values)) {
      if (v instanceof File) {
        body.append(`file:${key}`, v);
      } else {
        plainData[key] = v;
      }
    }
    body.append("meta", JSON.stringify({ siteId: ctx.siteId, pageId: ctx.pageId, blockId }));
    body.append("data", JSON.stringify(plainData));

    try {
      const res = await fetch("/api/forms/submit", { method: "POST", body });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Submission failed.");
      }
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Submission failed.");
    }
  }

  if (status === "done") {
    return <p className="text-sm text-gray-600">Thanks — your submission was received.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {visibleFields.map((field) => (
        <div key={field.id}>
          {field.type !== "checkbox" && (
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500"> *</span>}
            </label>
          )}
          <FieldWidget field={field} value={values[field.id]} onChange={(v) => updateValue(field.id, v)} />
        </div>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-2">
        {hasSteps && step > 0 && (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="rounded border px-4 py-2 text-sm">
            Back
          </button>
        )}
        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {status === "submitting" ? "Submitting..." : isLastStep ? submitLabel : "Next"}
        </button>
      </div>
    </form>
  );
}
