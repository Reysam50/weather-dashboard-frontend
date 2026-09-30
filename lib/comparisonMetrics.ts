// High/low/average helper used by the Compare screen's analytics matrix.
// (This file used to also hold a metric-picker config, COMPARISON_METRICS,
// which nothing rendered anymore once the old widget catalog was removed.)

export interface MetricStats {
  high: number | null;
  low: number | null;
  avg: number | null;
}

/**
 * High/low/average over a set of readings — used by both ComparisonTable
 * (per station, per metric, grouped by station) and StationSummaryTable
 * (per metric, one station). Centralized so both widgets agree on exactly
 * how "average" rounds, rather than each having its own copy.
 */
export function computeMetricStats(values: number[]): MetricStats {
  if (values.length === 0) return { high: null, low: null, avg: null };
  return {
    high: Math.max(...values),
    low: Math.min(...values),
    avg: Number((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1)),
  };
}