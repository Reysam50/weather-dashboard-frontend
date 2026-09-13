"use client";

import type { Station } from "@/lib/types";
import { formatTimeAgo } from "@/lib/formatTimeAgo";

interface StationListProps {
  stations: Station[];
  selectedStationId: string | null;
  onSelectStation: (id: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  /** Technical Team only (FR-12.3) — Administrator sees this as false. */
  canManage: boolean;
  onAddStationClick: () => void;
}

/**
 * Sidebar station list with search, per FR-12.1 (map-based selector) and
 * FR-12.2 (search). This search filters the station list you already
 * have by name — a *geocoding* search (typing a town/address to pan the
 * map somewhere new) is a separate feature; this covers "find one of my
 * stations quickly," which is the more common day-to-day need. Worth
 * adding the geocoding version later if you want full FR-12.2 coverage.
 */
export default function StationList({
  stations,
  selectedStationId,
  onSelectStation,
  searchQuery,
  onSearchChange,
  canManage,
  onAddStationClick,
}: StationListProps) {
  const filtered = stations.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-weather-card rounded-2xl border border-white/10 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-white/10 space-y-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search stations..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-weather-accent"
        />

        {canManage && (
          <button
            type="button"
            onClick={onAddStationClick}
            className="w-full bg-blue-600 hover:bg-blue-500 transition-colors rounded-lg py-2 text-sm font-medium"
          >
            + Add Station
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {filtered.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">
            No stations match your search.
          </p>
        ) : (
          filtered.map((station) => {
            const active = station.id === selectedStationId;
            return (
              <button
                key={station.id}
                type="button"
                onClick={() => onSelectStation(station.id)}
                className={`w-full text-left p-4 hover:bg-white/5 transition-colors ${
                  active ? "bg-white/10" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      station.status === "online" ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <span className="font-medium truncate">{station.name}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1 data-value">
                  {station.status === "online"
                    ? `Online — updated ${formatTimeAgo(station.lastSeenAt)}`
                    : `Station Offline — last seen ${formatTimeAgo(station.lastSeenAt)}`}
                </p>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}