"use client";

import { useState } from "react";
import type { StationMockData } from "@/lib/mockStationData";
import type { LiveTelemetryExtras } from "@/lib/liveTelemetryData";
import { scaleSeries, smoothLinePath } from "@/lib/chartPaths";
import { useAdminSettings } from "@/lib/AdminSettingsContext";

const VIEW_W = 600;
const VIEW_H = 200;
const BASELINE = 190;
const TOP_PAD = 15;
const MAX_TICKS = 8;

type Granularity = "minute" | "hourly" | "daily";

const GRANULARITY_OPTIONS: { key: Granularity; label: string }[] = [
  { key: "minute", label: "Minute" },
  { key: "hourly", label: "Hourly" },
  { key: "daily", label: "Daily" },
];

export default function DualGaugeRainfallCard({
  data,
  extras,
}: {
  data: StationMockData;
  extras: LiveTelemetryExtras;
}) {
  const { settings } = useAdminSettings();
  // Minute-resolution rain is the default view — the dashboard tracks
  // minute roll rain everywhere rather than a fixed "1 hour" window; this
  // toggle lets a viewer switch to hourly or daily aggregates on demand.
  const [granularity, setGranularity] = useState<Granularity>("minute");
  const series = data.rainByGranularity[granularity];
  const { labels, gauge1, gauge2, cumulative } = series;

  const n = labels.length;
  const slot = VIEW_W / n;
  const barW = Math.min(14, slot * 0.28);
  const maxBar = Math.max(...gauge1, ...gauge2, 0.1);
  const usableH = BASELINE - TOP_PAD;

  const cumPoints = scaleSeries(cumulative, VIEW_W - slot, VIEW_H - 40, 0).map((p) => ({
    x: p.x + slot / 2,
    y: p.y + 10,
  }));
  const cumLine = smoothLinePath(cumPoints);

  const latestEvent = gauge1[gauge1.length - 1] ?? 0;
  const rollingAccum = data.current.rollAvgRain_mm;
  const varianceOk = extras.rainVariancePct <= settings.rainGaugeVarianceTolerancePct;

  // Thin the x-axis labels down to ~MAX_TICKS so the minute view (60
  // points) doesn't collide; hourly (8) and daily (6) just show all of them.
  const tickStride = Math.max(1, Math.ceil(n / MAX_TICKS));

  return (
    <div className="bg-card-bg rounded-2xl p-7 border border-border-line shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-border-line">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white tracking-tight">
              DUAL-GAUGE RAINFALL // RATE VS. CUMULATIVE
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-semibold">
              G1 • G2 SYNC (±{settings.rainGaugeVarianceTolerancePct}% TOLERANCE)
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#090d16] border border-border-line font-mono text-[11px]">
            {GRANULARITY_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setGranularity(opt.key)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  granularity === opt.key
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 font-mono text-xs">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <span className="w-3 h-3 bg-cyan-400 rounded-sm" /> Gauge 1 (451A)
            </span>
            <span className="flex items-center gap-1.5 text-purple-300">
              <span className="w-3 h-3 bg-purple-400 rounded-sm" /> Gauge 2 (451A)
            </span>
            <span className="flex items-center gap-1.5 text-amber-300">
              <span className="w-3 h-0.5 bg-amber-400" /> Cumulative (mm)
            </span>
          </div>
        </div>
      </div>

      <div className="relative w-full h-64 my-5 rounded-xl bg-[#080c14] border border-border-line p-4 overflow-hidden">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
          <line stroke="#1c263c" strokeWidth={1} x1={0} x2={VIEW_W} y1={50} y2={50} />
          <line stroke="#1c263c" strokeWidth={1} x1={0} x2={VIEW_W} y1={100} y2={100} />
          <line stroke="#1c263c" strokeWidth={1} x1={0} x2={VIEW_W} y1={150} y2={150} />

          {labels.map((_, i) => {
            const cx = i * slot + slot * 0.35;
            const h1 = (gauge1[i] / maxBar) * usableH;
            const h2 = (gauge2[i] / maxBar) * usableH;
            return (
              <g key={i}>
                <rect fill="#00e5ff" height={h1} rx={2} width={barW} x={cx} y={BASELINE - h1} />
                <rect
                  fill="#a855f7"
                  height={h2}
                  rx={2}
                  width={barW}
                  x={cx + barW + 2}
                  y={BASELINE - h2}
                />
              </g>
            );
          })}

          <path d={cumLine} fill="none" stroke="#ffb95f" strokeLinecap="round" strokeWidth={3} />
          {cumPoints.length > 0 && (
            <circle
              cx={cumPoints[cumPoints.length - 1].x}
              cy={cumPoints[cumPoints.length - 1].y}
              fill="#ffb95f"
              r={5}
              stroke="#080c14"
              strokeWidth={2}
            />
          )}
        </svg>
        <div className="absolute bottom-1 inset-x-0 flex justify-between px-8 font-mono text-[11px] text-slate-500">
          {labels.map((label, i) =>
            i % tickStride === 0 || i === labels.length - 1 ? <span key={label + i}>{label}</span> : null
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-3 rounded-xl bg-[#090d16] border border-border-line text-center">
          <span className="text-slate-500 block text-[11px] uppercase">
            {GRANULARITY_OPTIONS.find((o) => o.key === granularity)?.label} Event
          </span>
          <span className="text-white font-bold text-sm">{latestEvent} mm</span>
        </div>
        <div className="p-3 rounded-xl bg-[#090d16] border border-border-line text-center">
          <span className="text-slate-500 block text-[11px] uppercase">Rolling Accum</span>
          <span className="text-cyan-300 font-bold text-sm">{rollingAccum} mm</span>
        </div>
        <div className="p-3 rounded-xl bg-[#090d16] border border-border-line text-center">
          <span className="text-slate-500 block text-[11px] uppercase">Weekly Total</span>
          <span className="text-white font-bold text-sm">{extras.rainWeeklyTotalMm} mm</span>
        </div>
        <div className="p-3 rounded-xl bg-[#090d16] border border-border-line text-center">
          <span className="text-slate-500 block text-[11px] uppercase">Gauge Variance</span>
          <span className={`font-bold text-sm ${varianceOk ? "text-emerald-400" : "text-rose-400"}`}>
            ±{extras.rainVariancePct}% ({varianceOk ? "Tolerable" : "Check Sensors"})
          </span>
        </div>
      </div>
    </div>
  );
}