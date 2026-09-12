export interface RawReadingColumn<T> {
  key: string;
  label: string;
  align?: "left" | "right";
  format: (row: T) => string;
}

interface RawReadingsTableProps<T> {
  title?: string;
  rows: T[];
  columns: RawReadingColumn<T>[];
  /** CSS max-height for the scrollable body, e.g. "24rem". */
  maxHeight?: string;
}

/**
 * Detailed, column-configurable table of individual readings over time —
 * the granular "every reading, every field" table from a weather-history
 * page, as opposed to DailySummaryTable.tsx (one row per day) or
 * StationSummaryTable.tsx (one row per metric).
 *
 * Generic over the row shape (<T>) and takes its columns as data rather
 * than hardcoding field names — the reference table has wind/UV/solar
 * columns your hardware doesn't produce; this component doesn't care what
 * the columns are, so it's ready for those once/if that sensor data exists,
 * without needing changes itself.
 */
export default function RawReadingsTable<T>({
  title = "Readings",
  rows,
  columns,
  maxHeight = "24rem",
}: RawReadingsTableProps<T>) {
  return (
    <div className="bg-weather-card rounded-2xl border border-white/10 overflow-hidden">
      <div className="p-4 md:p-6 pb-3">
        <h2 className="text-sm font-semibold text-gray-200">{title}</h2>
      </div>

      <div className="overflow-auto" style={{ maxHeight }}>
        <table className="w-full text-sm">
          <thead className="bg-white/5 sticky top-0">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-medium text-gray-400 ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-gray-500"
                >
                  No readings for this period.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
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
    </div>
  );
}