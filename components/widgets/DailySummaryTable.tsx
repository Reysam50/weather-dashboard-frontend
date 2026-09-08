export interface DailySummaryRow {
  dayNumber: string; // e.g. "01" — shown in the round badge
  weekday: string; // e.g. "Tuesday"
  tempHigh: number | null;
  tempLow: number | null;
  tempAvg: number | null;
  rainTotal: number;
}

interface DailySummaryTableProps {
  rows: DailySummaryRow[];
  unit?: string; // temperature unit, e.g. "°C"
  rainUnit?: string; // e.g. "mm"
}

/**
 * Per-day summary table — the "time-series table" widget type from
 * dashboard-reference-analysis.md §2. Styling copied directly from
 * WeatherNode's history.blade.php: round day-number badge, color-coded
 * max/min/rain columns, hover highlight per row, and an empty state when
 * there's no data for the selected period.
 */
export default function DailySummaryTable({
  rows,
  unit = "°",
  rainUnit = "mm",
}: DailySummaryTableProps) {
  return (
    <div className="bg-weather-card rounded-2xl border border-white/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-4 text-left font-medium text-gray-400">
                Date
              </th>
              <th className="px-4 py-4 text-right font-medium text-gray-400">
                Max
              </th>
              <th className="px-4 py-4 text-right font-medium text-gray-400">
                Min
              </th>
              <th className="px-4 py-4 text-right font-medium text-gray-400">
                Avg
              </th>
              <th className="px-4 py-4 text-right font-medium text-gray-400">
                Rainfall
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                  <div className="text-4xl mb-4">📭</div>
                  <p>No data available for this period</p>
                </td>
              </tr>
            ) : (
              rows.map((day) => (
                <tr
                  key={`${day.dayNumber}-${day.weekday}`}
                  className="hover:bg-white/5 transition"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold shrink-0">
                        {day.dayNumber}
                      </span>
                      <span className="text-gray-400">{day.weekday}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-weather-warm font-bold data-value">
                      {day.tempHigh !== null ? `${day.tempHigh}${unit}` : "--"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-weather-cold font-bold data-value">
                      {day.tempLow !== null ? `${day.tempLow}${unit}` : "--"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right data-value">
                    {day.tempAvg !== null ? `${day.tempAvg}${unit}` : "--"}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {day.rainTotal > 0 ? (
                      <span className="text-weather-rain font-medium data-value">
                        {day.rainTotal}
                        {rainUnit}
                      </span>
                    ) : (
                      <span className="text-gray-500 data-value">
                        0{rainUnit}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}