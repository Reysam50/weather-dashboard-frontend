"use client";

import { useMemo, useRef, useState } from "react";
import type { StationMockData } from "@/lib/mockStationData";
import type { LiveTelemetryExtras } from "@/lib/liveTelemetryData";
import { scaleSeries, smoothLinePath, areaPath } from "@/lib/chartPaths";

const RANGE_BUTTONS = [
  { label: "24H", hours: 24 },
  { label: "12H", hours: 12 },
  { label: "6H", hours: 6 },
] as const;

const MIN_WINDOW_HOURS = 2;
const TOTAL_HOURS = 24;

const THERMAL_BANDS = [
  { label: "Cold (<15°C)", swatch: "bg-cyan-400" },
  { label: "Mild (15-25°C)", swatch: "bg-emerald-400" },
  { label: "Warm (25-32°C)", swatch: "bg-amber-400" },
  { label: "Severe (>32°C)", swatch: "bg-rose-500", emphasize: true },
];

const VIEW_W = 800;
const VIEW_H = 240;

type DragMode = "move" | "resize-left" | "resize-right";
interface DragState {
  mode: DragMode;
  startX: number;
  startWindowStart: number;
  startWindowHours: number;
}

export default function DiurnalCycleCard({
  data,
  extras,
}: {
  data: StationMockData;
  extras: LiveTelemetryExtras;
}) {
  // windowStart/windowHours are hours-from-midnight, and can be
  // fractional while dragging — the pan bar below is a real draggable
  // control (both moving the whole window and resizing either edge),
  // not just a decorative bar fixed at 50% width like before. The 24H/
  // 12H/6H buttons are shortcuts that set these same two values, ending
  // aligned to "now" (the right edge) — they don't work independently of
  // the bar anymore, they drive it.
  const [windowHours, setWindowHours] = useState<number>(TOTAL_HOURS);
  const [windowStart, setWindowStart] = useState<number>(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const startIdx = Math.max(0, Math.min(TOTAL_HOURS - 1, Math.round(windowStart)));
  const endIdx = Math.max(startIdx + 1, Math.min(TOTAL_HOURS, Math.round(windowStart + windowHours)));
  const trend = data.fullDayTrend.slice(startIdx, endIdx);

  const tempValues = trend.map((p) => p.y);
  const dewOffset = data.current.airTemp - extras.dewPoint;
  const dewValues = tempValues.map((v) => Number((v - dewOffset - 2).toFixed(1)));

  const tempPoints = useMemo(() => scaleSeries(tempValues, VIEW_W, VIEW_H, 10), [tempValues]);
  const dewPoints = useMemo(() => scaleSeries(dewValues, VIEW_W, VIEW_H, 10), [dewValues]);
  const tempLine = smoothLinePath(tempPoints);
  const tempFill = areaPath(tempLine, tempPoints, VIEW_H);
  const dewLine = smoothLinePath(dewPoints);

  const isLatestWindow = endIdx >= TOTAL_HOURS;
  const activeIndex = hoverIndex ?? tempValues.length - 1;
  const activePoint = tempPoints[activeIndex];
  const activeTime = new Date(trend[activeIndex]?.x ?? Date.now()).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const min = tempValues.length ? Math.min(...tempValues) : 0;
  const max = tempValues.length ? Math.max(...tempValues) : 0;
  const yLabels = [max, max - (max - min) / 3, max - (2 * (max - min)) / 3, min].map((v) =>
    Math.round(v)
  );

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const idx = Math.round(fraction * (tempValues.length - 1));
    setHoverIndex(idx);
  }

  function handleRangeButton(hours: number) {
    setWindowHours(hours);
    setWindowStart(Math.max(0, TOTAL_HOURS - hours));
  }

  function handlePointerDown(mode: DragMode) {
    return (e: React.PointerEvent) => {
      e.preventDefault();
      dragRef.current = { mode, startX: e.clientX, startWindowStart: windowStart, startWindowHours: windowHours };
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    };
  }

  function handlePointerMove(e: PointerEvent) {
    const drag = dragRef.current;
    const track = trackRef.current;
    if (!drag || !track) return;
    const rect = track.getBoundingClientRect();
    const deltaHours = ((e.clientX - drag.startX) / rect.width) * TOTAL_HOURS;

    if (drag.mode === "move") {
      const clamped = Math.max(0, Math.min(TOTAL_HOURS - drag.startWindowHours, drag.startWindowStart + deltaHours));
      setWindowStart(clamped);
    } else if (drag.mode === "resize-left") {
      const originalEnd = drag.startWindowStart + drag.startWindowHours;
      const newStart = Math.max(0, Math.min(originalEnd - MIN_WINDOW_HOURS, drag.startWindowStart + deltaHours));
      setWindowStart(newStart);
      setWindowHours(originalEnd - newStart);
    } else {
      const newHours = Math.max(
        MIN_WINDOW_HOURS,
        Math.min(TOTAL_HOURS - drag.startWindowStart, drag.startWindowHours + deltaHours)
      );
      setWindowHours(newHours);
    }
  }

  function handlePointerUp() {
    dragRef.current = null;
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  }

  function handleExportCurve() {
    const header = ["Time", "Air Temp °C (MCP9808)", "Dew Point °C"];
    const rows = trend.map((p, i) => [
      new Date(p.x).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
      tempValues[i],
      dewValues[i],
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diurnal-temperature-curve.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-card-bg rounded-2xl p-7 border border-border-line shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-border-line">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white tracking-tight">
              AIR TEMPERATURE // FULL DIURNAL CYCLE
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-xs">
              60s SSE LIVE
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-card-bg-subtle p-1 rounded-xl border border-border-line font-mono text-xs">
            {RANGE_BUTTONS.map((r) => (
              <button
                key={r.label}
                type="button"
                onClick={() => handleRangeButton(r.hours)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  Math.round(windowHours) === r.hours && isLatestWindow
                    ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            title="Export Curve"
            onClick={handleExportCurve}
            className="w-8 h-8 rounded-xl bg-card-bg-subtle border border-border-line text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
          </button>
        </div>
      </div>

      {/* Thermal bands legend */}
      <div className="flex flex-wrap items-center gap-4 lg:gap-6 py-3 px-4 rounded-xl bg-[#090d16] border border-border-line my-5 font-mono text-xs">
        <span className="text-slate-500 font-medium">BANDS:</span>
        {THERMAL_BANDS.map((band) => (
          <span
            key={band.label}
            className={`flex items-center gap-1.5 ${
              band.emphasize ? "text-rose-300 font-semibold" : "text-slate-300"
            }`}
          >
            <span className={`w-3 h-2 rounded-sm ${band.swatch}`} />
            {band.label}
          </span>
        ))}
      </div>

      {/* Chart canvas */}
      <div
        className="relative w-full h-80 rounded-xl bg-[#080c14] border border-border-line p-4 overflow-hidden group"
        onMouseLeave={() => setHoverIndex(null)}
      >
        <div className="absolute inset-0 flex flex-col pointer-events-none opacity-25">
          <div className="h-1/5 bg-rose-500/15" />
          <div className="h-2/5 bg-amber-500/15" />
          <div className="h-1/4 bg-emerald-500/15" />
          <div className="flex-1 bg-cyan-500/15" />
        </div>
        <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none opacity-20">
          <div className="w-full border-b border-dashed border-slate-400" />
          <div className="w-full border-b border-dashed border-slate-400" />
          <div className="w-full border-b border-dashed border-slate-400" />
          <div className="w-full border-b border-dashed border-slate-400" />
        </div>

        <svg
          className="w-full h-full cursor-crosshair"
          fill="none"
          preserveAspectRatio="none"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          onMouseMove={handleMouseMove}
        >
          <defs>
            <linearGradient id="warmGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffb95f" stopOpacity="0.45" />
              <stop offset="65%" stopColor="#00e5ff" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={tempFill} fill="url(#warmGradient)" />
          <path d={tempLine} stroke="#ffb95f" strokeLinecap="round" strokeWidth={3} />
          <path d={dewLine} stroke="#00e5ff" strokeDasharray="5 5" strokeOpacity={0.8} strokeWidth={2} />
          {activePoint && (
            <>
              <line
                stroke="#c3f5ff"
                strokeDasharray="3 3"
                strokeOpacity={0.8}
                strokeWidth={1.5}
                x1={activePoint.x}
                x2={activePoint.x}
                y1={0}
                y2={VIEW_H}
              />
              <circle cx={activePoint.x} cy={activePoint.y} fill="#ffb95f" r={6} stroke="#090d16" strokeWidth={3} />
            </>
          )}
        </svg>

        {activePoint && (
          <div
            className="absolute top-10 bg-[#121828]/95 backdrop-blur-md border border-amber-400/40 px-4 py-2.5 rounded-xl shadow-2xl font-mono text-xs pointer-events-none"
            style={{
              left: `${Math.min(85, Math.max(15, (activePoint.x / VIEW_W) * 100))}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="text-slate-400 text-[11px]">
              {activeTime} CAT {hoverIndex === null && "• PEAK FLUX"}
            </div>
            <div className="text-amber-300 font-bold text-sm my-0.5">
              {tempValues[activeIndex]}°C <span className="text-[10px] text-slate-400 font-normal">(MCP9808)</span>
            </div>
            <div className="text-cyan-300 text-[11px]">Dew Point: {dewValues[activeIndex]}°C</div>
          </div>
        )}

        <div className="absolute left-3 top-3 bottom-3 flex flex-col justify-between font-mono text-[11px] text-slate-500 pointer-events-none">
          {yLabels.map((v, i) => (
            <span key={i}>{v}°C</span>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between font-mono text-xs text-slate-400">
          <span>{new Date(trend[0]?.x ?? Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })} CAT (START)</span>
          <span className="text-cyan-300 font-semibold">
            {isLatestWindow ? `SHOWING LAST ${Math.round(windowHours)}H` : `PANNED — ${Math.round(windowHours)}H WINDOW`}
          </span>
          <span>
            {new Date(trend[trend.length - 1]?.x ?? Date.now()).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}{" "}
            CAT {isLatestWindow ? "(NOW)" : ""}
          </span>
        </div>
        {/* Real drag-to-pan control: drag the highlighted window to move
            through the day, or drag either edge to resize the window —
            this used to be a fixed bar always centered at 50% width with
            no pointer handling at all. */}
        <div
          ref={trackRef}
          className="relative w-full h-8 bg-[#080c14] border border-border-line rounded-lg p-1 flex items-center touch-none select-none"
        >
          <div className="w-full h-2 opacity-25 pointer-events-none">
            <svg className="w-full h-full text-slate-400" preserveAspectRatio="none" viewBox="0 0 200 8">
              <path d="M 0 6 Q 50 1, 100 3 T 200 6" fill="none" stroke="currentColor" strokeWidth={1.5} />
            </svg>
          </div>
          <div
            onPointerDown={handlePointerDown("move")}
            className="absolute h-6 bg-cyan-500/20 border border-cyan-400/50 rounded flex items-center justify-between px-2 cursor-grab active:cursor-grabbing"
            style={{
              left: `${(windowStart / TOTAL_HOURS) * 100}%`,
              width: `${(windowHours / TOTAL_HOURS) * 100}%`,
            }}
          >
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                handlePointerDown("resize-left")(e);
              }}
              className="w-2 h-full -ml-1 flex items-center justify-center cursor-ew-resize"
            >
              <div className="w-1 h-3.5 bg-cyan-300 rounded-sm" />
            </div>
            <span className="font-mono text-[10px] text-cyan-200 font-bold uppercase tracking-widest select-none pointer-events-none">
              PAN {Math.round(windowHours)}H
            </span>
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                handlePointerDown("resize-right")(e);
              }}
              className="w-2 h-full -mr-1 flex items-center justify-center cursor-ew-resize"
            >
              <div className="w-1 h-3.5 bg-cyan-300 rounded-sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}