"use client";

import { useState } from "react";
import Link from "next/link";
import type { Station } from "@/lib/types";
import { MOCK_STATION_DATA } from "@/lib/mockStationData";
import { getLiveTelemetryExtras } from "@/lib/liveTelemetryData";
import { formatTimeAgoPrecise } from "@/lib/formatTimeAgo";
import { useHydrated } from "@/lib/useHydrated";
import { scaleSeries, smoothLinePath, areaPath } from "@/lib/chartPaths";

export default function StationInspectPod({
  station,
  onCalibrate,
}: {
  station: Station;
  onCalibrate: (station: Station) => void;
}) {
  const [pingState, setPingState] = useState<"idle" | "pinging" | "done">("idle");
  const [pingMs, setPingMs] = useState(0);
  const hydrated = useHydrated();

  const data = MOCK_STATION_DATA[station.id];
  const isOffline = station.status === "offline";

  // Last ~12 hours of the day's temperature curve, for the small sparkline.
  const recentTrend = data ? data.fullDayTrend.slice(-12).map((p) => p.y) : [];
  const points = scaleSeries(recentTrend, 240, 40, 3);
  const line = smoothLinePath(points);
  const fill = areaPath(line, points, 40);
  const min = recentTrend.length ? Math.min(...recentTrend) : 0;
  const max = recentTrend.length ? Math.max(...recentTrend) : 0;

  function handlePing() {
    setPingState("pinging");
    const latency = 22 + Math.round(Math.random() * 40);
    setTimeout(() => {
      setPingMs(latency);
      setPingState("done");
      setTimeout(() => setPingState("idle"), 3000);
    }, 700);
  }

  return (
    <div className="absolute top-4 right-4 w-80 max-w-[calc(100vw-2rem)] bg-card-bg/95 backdrop-blur-xl rounded-xl p-4 shadow-2xl z-[1000] border border-border-hover">
      <div className="flex items-start justify-between pb-2.5 border-b border-border-line">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isOffline ? "bg-error animate-pulse" : "bg-primary-container animate-pulse"
              }`}
            />
            <span className="font-bold text-sm text-white">{station.name}</span>
          </div>
          <span className="font-mono text-[10px] text-on-surface-variant">
            Station AWS-{station.id.padStart(2, "0")}
          </span>
        </div>
        <span
          className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold tracking-wider border ${
            isOffline
              ? "bg-error/15 text-error border-error/30"
              : "bg-primary-container/10 text-primary-container border-primary-container/25"
          }`}
        >
          {isOffline ? "Offline" : "Online"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 py-2.5 font-mono text-xs">
        <div className="bg-card-bg-subtle p-2 rounded border border-border-line">
          <span className="text-[10px] text-on-surface-variant block">GPS LAT/LON</span>
          <span className="text-white font-semibold">
            {station.latitude.toFixed(4)}°, {station.longitude.toFixed(4)}°
          </span>
        </div>
        <div className="bg-card-bg-subtle p-2 rounded border border-border-line">
          <span className="text-[10px] text-on-surface-variant block">LAST SEEN</span>
          <span className="text-white font-semibold">
            {hydrated ? formatTimeAgoPrecise(station.lastSeenAt) : "…"}
          </span>
        </div>
        <div className="bg-card-bg-subtle p-2 rounded border border-border-line col-span-2">
          <span className="text-[10px] text-on-surface-variant block">PARTICLE DEVICE ID</span>
          <span className="text-primary-container font-mono truncate block">
            {station.particleDeviceId}
          </span>
        </div>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-3 gap-1.5 py-1.5 bg-card-bg-subtle rounded-lg p-2 border border-border-line text-center">
            <div>
              <span className="text-[10px] text-on-surface-variant block">AIR TEMP</span>
              <span className="font-mono text-lg font-bold text-primary-container">
                {data.current.airTemp}
                <span className="text-xs font-normal">°C</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] text-on-surface-variant block">BARO PRESS</span>
              <span className="font-mono text-lg font-bold text-white">
                {data.current.pressure}
              </span>
              <span className="text-[10px] text-on-surface-variant block">hPa</span>
            </div>
            <div>
              <span className="text-[10px] text-on-surface-variant block">RAIN (1HR)</span>
              <span className="font-mono text-lg font-bold text-primary-container">
                {data.current.rollAvgRain_mm}
                <span className="text-xs font-normal">mm</span>
              </span>
            </div>
          </div>

          <div className="mt-2.5">
            <div className="flex items-center justify-between font-mono text-[10px] text-on-surface-variant mb-1">
              <span>TEMP CURVE (LAST 12H)</span>
              <span className="text-primary-container font-mono">
                {min}° - {max}°C
              </span>
            </div>
            <svg className="w-full h-10 overflow-visible" viewBox="0 0 240 40">
              <path d={fill} fill="rgba(0, 229, 255, 0.15)" />
              <path d={line} fill="none" stroke="#00e5ff" strokeLinecap="round" strokeWidth={2} />
              {points.length > 0 && (
                <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} fill="#00e5ff" r={3} />
              )}
            </svg>
          </div>
        </>
      )}

      <div className="mt-3 flex items-center gap-1.5">
        <Link
          href="/dashboard"
          className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-center bg-primary-container text-slate-950 hover:bg-primary transition-all flex items-center justify-center gap-1 shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">show_chart</span>
          <span>Jump to Telemetry</span>
        </Link>
        <button
          type="button"
          onClick={() => onCalibrate(station)}
          title="Calibrate barometric & temp offsets"
          className="p-1.5 rounded-lg bg-card-bg-subtle text-on-surface-variant hover:text-white hover:border-slate-500 transition-colors border border-border-line"
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
        </button>
        <button
          type="button"
          onClick={handlePing}
          title="Ping hardware core"
          className="p-1.5 rounded-lg bg-card-bg-subtle text-on-surface-variant hover:text-primary-container transition-colors border border-border-line relative"
        >
          <span
            className={`material-symbols-outlined text-[18px] ${
              pingState === "pinging" ? "animate-pulse" : ""
            }`}
          >
            cell_tower
          </span>
        </button>
      </div>
      {pingState !== "idle" && (
        <p className="mt-1.5 text-right font-mono text-[10px] text-primary-container">
          {pingState === "pinging" ? "Pinging…" : `Round-trip: ${pingMs}ms`}
        </p>
      )}
    </div>
  );
}