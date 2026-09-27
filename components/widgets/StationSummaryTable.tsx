import type { ComparisonMetricConfig } from "@/lib/comparisonMetrics";
import { computeMetricStats } from "@/lib/comparisonMetrics";
import type { StationMockData } from "@/lib/mockStationData";

interface StationSummaryTableProps {
  title?: string;
  /** e.g. "September 7 – September 13, 2026" — shown under the title. */
  periodLabel: string;
  data: StationMockData;
  metrics: ComparisonMetricConfig[];
}

/**
 * Single-station period summary: High / Low / Average across several
 * metrics — the top "Summary" panel from a typical weather-history page.
 * Different from ComparisonTable.tsx (which does the same math but
 * grouped by MULTIPLE stations); this is the one-station version, meant
 * for a normal per-station dashboard rather than the comparison view.
 */
export default function StationSummaryTable({
  title = "Summary",
  periodLabel,
  data,
  metrics,
}: StationSummaryTableProps) {
  return (
    <div className="bg-weather-card rounded-2xl border border-white/10 overflow-hidden">
      <div className="p-4 md:p-6 pb-3">
        <h2 className="text-sm font-semibold text-gray-200">{title}</h2>
        <p className="text-xs text-gray-400">{periodLabel}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Metric</th>
              <th className="px-4 py-3 text-right font-medium text-gray-400">High</th>
              <th className="px-4 py-3 text-right font-medium text-gray-400">Low</th>
              <th className="px-4 py-3 text-right font-medium text-gray-400">Average</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {metrics.map((metric) => {
              const stats = computeMetricStats(metric.getHistory(data));
              return (
                <tr key={metric.key} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-gray-300">{metric.label}</td>
                  <td className="px-4 py-3 text-right data-value">
                    {stats.high !== null ? `${stats.high}${metric.unit}` : "--"}
                  </td>
                  <td className="px-4 py-3 text-right data-value">
                    {stats.low !== null ? `${stats.low}${metric.unit}` : "--"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold data-value">
                    {stats.avg !== null ? `${stats.avg}${metric.unit}` : "--"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}