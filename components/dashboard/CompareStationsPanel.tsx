"use client";

import type { Station } from "@/lib/types";
import SearchableToggleList from "./SearchableToggleList";

interface CompareStationsPanelProps {
  stations: Station[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

const MAX_COMPARE = 4;

/**
 * Station picker for FR-2.2's comparison view — a thin wrapper around
 * SearchableToggleList mapping stations to list items (status color dot +
 * name). Kept separate from StationList.tsx (single-select, normal
 * dashboard) so turning Compare mode on/off can't affect that flow.
 *
 * Capped at MAX_COMPARE — an overlay chart with a station count as high
 * as, say, 8 becomes unreadable regardless of chart type.
 */
export default function CompareStationsPanel({
  stations,
  selectedIds,
  onToggle,
}: CompareStationsPanelProps) {
  return (
    <SearchableToggleList
      title="Stations"
      items={stations.map((s) => ({
        id: s.id,
        label: s.name,
        dotColor: s.status === "online" ? "#22c55e" : "#ef4444",
      }))}
      selectedIds={selectedIds}
      onToggle={onToggle}
      maxSelected={MAX_COMPARE}
      searchPlaceholder="Search stations..."
    />
  );
}