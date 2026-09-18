"use client";

import { mockStations } from "@/lib/mockStations";
import { MOCK_STATION_DATA } from "@/lib/mockStationData";
import { formatTimeAgoPrecise } from "@/lib/formatTimeAgo";
import { useHydrated } from "@/lib/useHydrated";

export default function NodeHealthPulse() {
  const hydrated = useHydrated();

  return (
    <div className="bg-card-bg rounded-xl border border-border-line p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary-container">hub</span>
          <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
            AWS Node Health Pulse
          </span>
        </div>
        <span className="font-mono text-[10px] text-on-surface-variant">MESH: {mockStations.length} STATIONS</span>
      </div>

      <div className="space-y-2">
        {mockStations.map((station) => {
          const data = MOCK_STATION_DATA[station.id];
          const offline = station.status === "offline";
          return (
            <div key={station.id} className="p-2.5 rounded-lg bg-[#080c14] border border-border-line">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <span className={`w-1.5 h-1.5 rounded-full ${offline ? "bg-error" : "bg-primary-container animate-pulse"}`} />
                  {station.name}
                </span>
                <span
                  className={`font-mono text-[10px] font-bold uppercase ${
                    offline ? "text-error" : "text-primary-container"
                  }`}
                >
                  {offline ? "OFFLINE" : "ONLINE"} ({hydrated ? formatTimeAgoPrecise(station.lastSeenAt) : "—"})
                </span>
              </div>
              {data && (
                <span className="font-mono text-[10px] text-on-surface-variant block mt-0.5">
                  {data.current.airTemp}°C | {data.current.pressure} hPa
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}