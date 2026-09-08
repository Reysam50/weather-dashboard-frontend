"use client";

import { COMPARISON_METRICS } from "@/lib/comparisonMetrics";
import SearchableToggleList from "./SearchableToggleList";

interface CompareMetricsPanelProps {
  selectedKeys: string[];
  onToggle: (key: string) => void;
}

/**
 * Metric picker for the comparison view — a thin wrapper around
 * SearchableToggleList mapping metrics to list items (metric color dot +
 * label). Sits side by side with CompareStationsPanel on the dashboard.
 */
export default function CompareMetricsPanel({
  selectedKeys,
  onToggle,
}: CompareMetricsPanelProps) {
  return (
    <SearchableToggleList
      title="Metrics"
      items={COMPARISON_METRICS.map((m) => ({
        id: m.key,
        label: m.label,
        dotColor: m.color,
      }))}
      selectedIds={selectedKeys}
      onToggle={onToggle}
      searchPlaceholder="Search metrics..."
    />
  );
}