"use client";

import { useStationContext } from "@/lib/StationContext";
import { formatTimeAgoPrecise } from "@/lib/formatTimeAgo";

/**
 * Header station picker — the Live Telemetry redesign puts this in the top
 * bar instead of the big station list + map panel the dashboard page used
 * to render inline (that panel is unique to the Station Map screen now, see
 * app/(protected)/stations/page.tsx, so nothing was actually lost by
 * removing it from here).
 *
 * Hidden entirely for Station Operators, who only ever see their one
 * assigned station (StationContext.canSelectStation already enforces this
 * at the state level; this component just doesn't bother rendering a
 * single-option picker).
 */
export default function StationDropdown() {
  const { stations, selectedStationId, setSelectedStationId, canSelectStation } =
    useStationContext();

  if (!canSelectStation) return null;

  return (
    <div className="hidden md:flex items-center bg-card-bg border border-border-line hover:border-cyan-500/40 rounded-xl px-2.5 py-1.5 transition-colors">
      <span className="material-symbols-outlined text-[16px] text-primary-container mr-1.5">
        sensors
      </span>
      <select
        className="bg-transparent text-xs font-mono text-slate-200 focus:outline-none cursor-pointer pr-1"
        value={selectedStationId}
        onChange={(e) => setSelectedStationId(e.target.value)}
      >
        {stations.map((station) => (
          <option key={station.id} className="bg-card-bg text-white" value={station.id}>
            {station.status === "offline"
              ? `${station.name} [Offline]`
              : `${station.name} [${formatTimeAgoPrecise(station.lastSeenAt)}]`}
          </option>
        ))}
      </select>
    </div>
  );
}
