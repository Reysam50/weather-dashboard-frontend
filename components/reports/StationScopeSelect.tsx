"use client";

import type { Station } from "@/lib/types";

interface StationScopeSelectProps {
  stations: Station[];
  /** null represents "All Stations". */
  value: string | null;
  onChange: (value: string | null) => void;
  /** Administrator/Technical Team only, per api-specification.md §6 — a
   * Station Operator's requests must always name a concrete station. */
  allowAllStations: boolean;
  disabled?: boolean;
}

/**
 * Station-scope dropdown shared by the quick-export and schedule-creation
 * forms, so the "who's allowed to pick All Stations" rule lives in exactly
 * one place instead of being duplicated (and potentially drifting) across
 * both forms.
 */
export default function StationScopeSelect({
  stations,
  value,
  onChange,
  allowAllStations,
  disabled,
}: StationScopeSelectProps) {
  return (
    <select
      value={value ?? "__all__"}
      onChange={(e) => onChange(e.target.value === "__all__" ? null : e.target.value)}
      disabled={disabled}
      className="input-dark w-full px-3 py-2 rounded-lg text-sm text-white disabled:opacity-50"
    >
      {allowAllStations && <option value="__all__">All Stations</option>}
      {stations.map((station) => (
        <option key={station.id} value={station.id}>
          {station.name}
        </option>
      ))}
    </select>
  );
}