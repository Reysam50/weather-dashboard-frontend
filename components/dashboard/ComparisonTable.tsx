import { Fragment } from "react";
import type { Station } from "@/lib/types";
import type { ComparisonMetricConfig } from "@/lib/comparisonMetrics";
import { MOCK_STATION_DATA } from "@/lib/mockStationData";

interface ComparisonTableProps {
  stations: Station[];
  /** Only the metrics currently selected in CompareMetricsPanel. */
  metrics: ComparisonMetricConfig[];
}

function computeStats(values: number[]) {
  if (values.length === 0) return { high: null, low: null, avg: null };
  const high = Math.max(...values);
  const low = Math.min(...values);
  const avg = Number((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1));
  return { high, low, avg };
}

/**
 * Summary table — High / Low / Average per metric, per station, over the
 * currently loaded window. Previously this showed one unlabeled "current
 * value" per station/metric, which didn't say WHAT that number was (right
 * now? today so far? some other day?). High/Low/Avg under a labeled period
 * is unambiguous regardless of the exact range, and matches a standard
 * weather-history summary table layout instead of inventing our own.
 *
 * TODO (frontend developer): "Today" in the heading is a placeholder —
 * replace with the real selected date range once this view gets a
 * date-range picker; right now it just reflects whatever window the mock
 * hourly data represents.
 */
export default function ComparisonTable({ stations, metrics }: ComparisonTableProps) {
  if (stations.length === 0 || metrics.length === 0) return null;

  return (
    <div className="bg-weather-card rounded-2xl border border-white/10 overflow-hidden mt-4">
      <div className="p-4 md:p-6 pb-3">
        <h2 className="text-sm font-semibold text-gray-200">Summary — Today</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th
                rowSpan={2}
                className="px-4 py-2 text-left font-medium text-gray-400 align-bottom"
              >
                Metric
              </th>
              {stations.map((station) => (
                <th
                  key={station.id}
                  colSpan={3}
                  className="px-3 py-2 text-center font-medium text-gray-300 border-l border-white/5"
                >
                  {station.name}
                </th>
              ))}
            </tr>
            <tr>
              {stations.map((station) => (
                <Fragment key={station.id}>
                  <th className="px-3 py-1 text-right font-medium text-gray-500 text-xs border-l border-white/5">
                    High
                  </th>
                  <th className="px-3 py-1 text-right font-medium text-gray-500 text-xs">
                    Low
                  </th>
                  <th className="px-3 py-1 text-right font-medium text-gray-500 text-xs">
                    Avg
                  </th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {metrics.map((metric) => (
              <tr key={metric.key} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 text-gray-300">{metric.label}</td>
                {stations.map((station) => {
                  const stationData = MOCK_STATION_DATA[station.id];
                  const stats = stationData
                    ? computeStats(metric.getHistory(stationData))
                    : { high: null, low: null, avg: null };
                  return (
                    <Fragment key={station.id}>
                      <td className="px-3 py-3 text-right data-value border-l border-white/5">
                        {stats.high !== null ? `${stats.high}${metric.unit}` : "--"}
                      </td>
                      <td className="px-3 py-3 text-right data-value">
                        {stats.low !== null ? `${stats.low}${metric.unit}` : "--"}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold data-value">
                        {stats.avg !== null ? `${stats.avg}${metric.unit}` : "--"}
                      </td>
                    </Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}