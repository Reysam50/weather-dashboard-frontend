"use client";

import { useMemo, useState } from "react";

export interface RawReadingColumn<T> {
  key: string;
  label: string;
  align?: "left" | "right";
  format: (row: T) => string;
  /** Optional raw value for correct numeric/date sorting — without this,
   * sorting falls back to comparing format()'s string output, which sorts
   * "10" before "9" alphabetically. Pass e.g. `(r) => r.temp` for a
   * numeric column. */
  sortValue?: (row: T) => string | number;
}

interface RawReadingsTableProps<T> {
  title?: string;
  rows: T[];
  columns: RawReadingColumn<T>[];
  maxHeight?: string;
  pageSize?: number;
}

type SortDirection = "asc" | "desc";

/**
 * Detailed, column-configurable table of individual readings —
 * SORTABLE, SEARCHABLE, PAGINATED, and EXPORTABLE, per
 * dashboard-reference-analysis.md's table widget spec, which explicitly
 * calls for all four. The original version of this component had none of
 * them (a static list). This is the widget most likely to hold a large
 * number of rows in production (every reading, not a daily/period
 * rollup), so it's the one that actually needs this interactivity —
 * DailySummaryTable/StationSummaryTable stay simple since they're always
 * small, fixed-size tables where sorting/pagination wouldn't add anything.
 *
 * Export is genuinely functional right now, not a mock — it's plain
 * client-side CSV generation from whatever's currently filtered/sorted,
 * no backend involved.
 */
export default function RawReadingsTable<T>({
  title = "Readings",
  rows,
  columns,
  maxHeight = "24rem",
  pageSize = 10,
}: RawReadingsTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((row) =>
      columns.some((col) => col.format(row).toLowerCase().includes(q))
    );
  }, [rows, columns, query]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const column = columns.find((c) => c.key === sortKey);
    if (!column) return filtered;

    const getValue = column.sortValue ?? column.format;
    // Sort (row, originalIndex) pairs so equal values keep their original
    // relative order instead of Array.sort's unstable-in-some-engines
    // default behavior.
    const withIndex = filtered.map((row, i) => ({ row, i }));
    withIndex.sort((a, b) => {
      const va = getValue(a.row);
      const vb = getValue(b.row);
      if (va < vb) return sortDirection === "asc" ? -1 : 1;
      if (va > vb) return sortDirection === "asc" ? 1 : -1;
      return a.i - b.i;
    });
    return withIndex.map((w) => w.row);
  }, [filtered, columns, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const clampedPage = Math.min(page, totalPages - 1);
  const pageRows = sorted.slice(
    clampedPage * pageSize,
    clampedPage * pageSize + pageSize
  );

  function handleSort(key: string) {
    setPage(0);
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  function handleExportCsv() {
    const header = columns.map((c) => c.label).join(",");
    const body = sorted
      .map((row) =>
        columns.map((c) => `"${c.format(row).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-weather-card rounded-2xl border border-white/10 overflow-hidden">
      <div className="p-4 md:p-6 pb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-200">{title}</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search..."
            className="input-dark px-3 py-1.5 rounded-lg text-xs text-white placeholder:text-gray-500 w-32 sm:w-44"
          />
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={sorted.length === 0}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-auto" style={{ maxHeight }}>
        <table className="w-full text-sm">
          <thead className="bg-white/5 sticky top-0">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-4 py-3 font-medium text-gray-400 cursor-pointer select-none hover:text-gray-200 transition-colors ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      <span className="text-gray-500">
                        {sortDirection === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-gray-500"
                >
                  {query
                    ? "No readings match your search."
                    : "No readings for this period."}
                </td>
              </tr>
            ) : (
              pageRows.map((row, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 data-value ${
                        col.align === "right" ? "text-right" : "text-left"
                      }`}
                    >
                      {col.format(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {sorted.length > pageSize && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 text-xs text-gray-400">
          <span>
            Page {clampedPage + 1} of {totalPages} ({sorted.length} rows)
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={clampedPage === 0}
              className="px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={clampedPage >= totalPages - 1}
              className="px-2 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}