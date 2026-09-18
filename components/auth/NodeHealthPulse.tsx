"use client";

import { mockStations } from "@/lib/mockStations";
import { MOCK_STATION_DATA } from "@/lib/mockStationData";
import { formatTimeAgoPrecise } from "@/lib/formatTimeAgo";
import { scaleSeries, smoothLinePath } from "@/lib/chartPaths";
import { useHydrated } from "@/lib/useHydrated";

export default function NodeHealthPulse() {
  const hydrated = useHydrated();
  const primary = mockStations.find((s) => s.status === "online") ?? mockStations[0];
  const pressureHistory = primary ? MOCK_STATION_DATA[primary.id]?.pressureHistory ?? [] : [];
  const points = scaleSeries(pressureHistory, 320, 60, 4);
  const line = smoothLinePath(points);
  const trend =
    pressureHistory.length >= 2
      ? Number((pressureHistory[pressureHistory.length - 1] - pressureHistory[0]).toFixed(1))
      : 0;
  const hours = MOCK_STATION_DATA[primary?.id ?? "1"]?.hourLabels.length ?? 0;

  return (
    <div className="flex flex-col gap-4">
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

      {pressureHistory.length > 0 && (
        <div className="bg-card-bg rounded-xl border border-border-line p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[11px] text-on-surface-variant uppercase">
              Barometric Gradient (Last {hours}h)
            </span>
            <span className={`font-mono text-[11px] font-bold ${trend >= 0 ? "text-secondary" : "text-primary-container"}`}>
              {trend >= 0 ? "+" : ""}
              {trend} hPa
            </span>
          </div>
          <svg className="w-full h-14 text-primary-container" preserveAspectRatio="none" viewBox="0 0 320 60">
            <path d={line} fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={2} />
          </svg>
        </div>
      )}
    </div>
  );
}