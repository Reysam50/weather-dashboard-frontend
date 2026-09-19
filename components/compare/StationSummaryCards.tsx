"use client";

import type { Station } from "@/lib/types";
import { MOCK_STATION_DATA } from "@/lib/mockStationData";
import { getStationHardware } from "@/lib/stationHardware";
import { formatTimeAgoPrecise } from "@/lib/formatTimeAgo";
import { formatOfflineDuration } from "@/lib/compareData";
import { useHydrated } from "@/lib/useHydrated";

export default function StationSummaryCards({
  stations,
  colors,
  onRemove,
}: {
  stations: Station[];
  colors: Record<string, string>;
  onRemove: (id: string) => void;
}) {
  const hydrated = useHydrated();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {stations.map((station) => {
        const data = MOCK_STATION_DATA[station.id];
        const hw = getStationHardware(station.id);
        const color = colors[station.id];
        const offline = station.status === "offline";

        return (
          <div
            key={station.id}
            className={`relative bg-card-bg/90 backdrop-blur-md rounded-xl p-4 shadow-md flex flex-col gap-2.5 border border-border-line group ${
              offline ? "opacity-90" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => onRemove(station.id)}
              title="Remove from comparison"
              className="absolute top-2.5 right-2.5 w-6 h-6 rounded-md flex items-center justify-center text-slate-600 hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">close</span>
            </button>

            <div className="flex items-center justify-between pr-6">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                  {!offline && (
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ backgroundColor: color }}
                    />
                  )}
                  <span
                    className="relative inline-flex rounded-full h-2.5 w-2.5"
                    style={{ backgroundColor: color }}
                  />
                </span>
                <span className="font-bold text-white text-sm">{station.name}</span>
              </div>
              <span
                className={`font-mono text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                  offline ? "bg-error/15 text-error" : "bg-card-bg-subtle text-primary-container"
                }`}
              >
                {offline ? `Offline (${hydrated ? formatOfflineDuration(station.lastSeenAt) : "…"})` : `AWS #${station.id.padStart(2, "0")} // ${hw.terrainLabel}`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 items-end pt-1 font-mono">
              <div>
                <div className="text-[10px] text-on-surface-variant uppercase">
                  {offline ? "Model Fallback" : "Current Temp"}
                </div>
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-3xl font-bold tabular-nums"
                    style={{ color: offline ? "#64748b" : color }}
                  >
                    {offline ? (data?.current.airTemp ?? "—") : data?.current.airTemp ?? "—"}
                  </span>
                  <span className={`text-xs ${offline ? "text-slate-500" : "text-on-surface-variant"}`}>
                    °C{offline ? " (est)" : ""}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5 text-right">
                {offline ? (
                  <>
                    <span className="text-[10px] text-error flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">warning</span>
                      Synthetic fallback active
                    </span>
                    <span className="text-[10px] text-on-surface-variant">
                      Last: {hydrated ? formatTimeAgoPrecise(station.lastSeenAt) : "…"}
                    </span>
                  </>
                ) : (
                  <span className="text-[10px] flex items-center gap-1" style={{ color }}>
                    <span className="material-symbols-outlined text-[12px]">sensors</span>
                    Sync: {hydrated ? formatTimeAgoPrecise(station.lastSeenAt) : "…"}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}