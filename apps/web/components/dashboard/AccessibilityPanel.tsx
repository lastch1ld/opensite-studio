"use client";

import { useState } from "react";
import Link from "next/link";

type Issue = {
  rule: string;
  severity: "error" | "warning";
  message: string;
  blockId: string;
  blockType: string;
  path: string;
};

type PageResult = { pageId: string; title: string; slug: string; scanned: boolean; issues: Issue[] };
type Report = { scanned: string; pages: PageResult[]; totals: { errors: number; warnings: number } };

export function AccessibilityPanel({ siteId }: { siteId: string }) {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runScan(onPublished: boolean) {
    setLoading(true);
    setError(null);
    setPublished(onPublished);
    const res = await fetch(`/api/sites/${siteId}/a11y${onPublished ? "?published=1" : ""}`);
    setLoading(false);
    if (!res.ok) {
      setError("Scan failed.");
      return;
    }
    setReport(await res.json());
  }

  const pagesWithIssues = report?.pages.filter((p) => p.issues.length > 0) ?? [];
  const unscanned = report?.pages.filter((p) => !p.scanned) ?? [];

  return (
    <div className="chrome-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text)]">Accessibility</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Checks contrast, alt text, form labels, control names and heading order across every page.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => runScan(false)} disabled={loading} className="chrome-btn chrome-btn-primary">
            {loading && !published ? "Scanning…" : "Scan drafts"}
          </button>
          <button onClick={() => runScan(true)} disabled={loading} className="chrome-btn chrome-btn-secondary">
            {loading && published ? "Scanning…" : "Scan published"}
          </button>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}

      {report && (
        <div className="mt-4">
          <p className="text-sm text-[var(--text)]">
            {report.totals.errors === 0 && report.totals.warnings === 0 ? (
              <>No issues found in {report.scanned} content.</>
            ) : (
              <>
                <span className="font-medium text-[var(--danger)]">{report.totals.errors} error(s)</span> and{" "}
                {report.totals.warnings} warning(s) in {report.scanned} content.
              </>
            )}
          </p>

          {unscanned.length > 0 && (
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Not scanned (no {report.scanned} content yet): {unscanned.map((p) => p.title).join(", ")}
            </p>
          )}

          <div className="mt-3 flex flex-col gap-4">
            {pagesWithIssues.map((page) => (
              <div key={page.pageId}>
                <Link
                  href={`/edit/${siteId}/${page.pageId}`}
                  className="text-sm font-medium text-[var(--text)] hover:text-[var(--accent)]"
                >
                  {page.title} <span className="text-[var(--text-muted)]">/{page.slug}</span>
                </Link>
                <ul className="mt-1 flex flex-col gap-1.5">
                  {page.issues.map((issue, i) => (
                    <li key={`${issue.blockId}-${issue.rule}-${i}`} className="flex gap-2 text-xs">
                      <span
                        className={`mt-0.5 h-fit shrink-0 rounded-full px-1.5 py-0.5 ${
                          issue.severity === "error"
                            ? "bg-[var(--danger-soft)] text-[var(--danger)]"
                            : "bg-[var(--surface-sunken)] text-[var(--text-muted)]"
                        }`}
                      >
                        {issue.rule}
                      </span>
                      <span className="text-[var(--text-muted)]">
                        {issue.message} <span className="text-[var(--text-faint)]">({issue.path})</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
