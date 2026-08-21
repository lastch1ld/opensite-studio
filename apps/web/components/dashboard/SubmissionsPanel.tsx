"use client";

type Submission = { id: string; blockId: string; data: Record<string, unknown>; createdAt: string };

function toCsv(submissions: Submission[]): string {
  const columns = Array.from(new Set(submissions.flatMap((s) => Object.keys(s.data)))).sort();
  const header = ["submittedAt", "blockId", ...columns];
  const rows = submissions.map((s) => [
    s.createdAt,
    s.blockId,
    ...columns.map((c) => {
      const v = s.data[c];
      return v === undefined || v === null ? "" : String(v);
    }),
  ]);
  const escape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return [header, ...rows].map((row) => row.map(escape).join(",")).join("\n");
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Basic table + CSV export of a Page's FormSubmission rows — "not a full
// reporting/analytics dashboard, which is explicitly out of scope"
// (docs/forms.md).
export function SubmissionsPanel({ pageTitle, submissions }: { pageTitle: string; submissions: Submission[] }) {
  const columns = Array.from(new Set(submissions.flatMap((s) => Object.keys(s.data)))).sort();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Submissions — {pageTitle}</h1>
        <button
          onClick={() => downloadCsv(toCsv(submissions), `submissions-${pageTitle}.csv`)}
          disabled={submissions.length === 0}
          className="rounded border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40"
        >
          Export CSV
        </button>
      </div>
      <div className="mt-6 overflow-x-auto rounded border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2">Submitted</th>
              <th className="px-3 py-2">Form block</th>
              {columns.map((c) => (
                <th key={c} className="px-3 py-2">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {submissions.map((s) => (
              <tr key={s.id}>
                <td className="whitespace-nowrap px-3 py-2 text-gray-500">{new Date(s.createdAt).toLocaleString()}</td>
                <td className="whitespace-nowrap px-3 py-2 text-gray-400">{s.blockId.slice(0, 8)}</td>
                {columns.map((c) => (
                  <td key={c} className="px-3 py-2">
                    {String(s.data[c] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {submissions.length === 0 && <p className="p-4 text-sm text-gray-500">No submissions yet.</p>}
      </div>
    </div>
  );
}
