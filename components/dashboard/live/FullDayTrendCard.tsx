"use client";

import { useMemo, useRef, useState } from "react";
import type { TrendPoint } from "@/components/widgets/TemperatureTrendChart";
import { scaleSeries, smoothLinePath, areaPath } from "@/lib/chartPaths";
import { OfflineCardBody } from "@/components/layout/OfflineCardBody";

const RANGE_BUTTONS = [
  { label: "24H", hours: 24 },
  { label: "12H", hours: 12 },
  { label: "6H", hours: 6 },
] as const;

const MIN_WINDOW_HOURS = 2;
const TOTAL_HOURS = 24;
const VIEW_W = 800;
const VIEW_H = 240;

type DragMode = "move" | "resize-left" | "resize-right";
interface DragState {
  mode: DragMode;
  startX: number;
  startWindowStart: number;
  startWindowHours: number;
}

export interface TrendBand {
  label: string;
  swatch: string;
  emphasize?: boolean;
}

/**
 * Generic "full diurnal cycle" graph — same drag-to-pan/resize window
 * ("slider"), 24H/12H/6H shortcuts, hover-scrub tooltip and CSV export as
 * DiurnalCycleCard (the air-temp graph), but parameterized so it can be
 * reused for any single 24h series (humidity, pressure, wind direction, ...)
 * without duplicating all of that pointer-handling logic per metric.
 */
export default function FullDayTrendCard({
  title,
  liveBadgeLabel = "60s SSE LIVE",
  sensorLabel,
  unit,
  trend,
  lineColorHex,
  fillGradientHex,
  bands,
  yDomain,
  yAxisFormatter,
  valueFormatter,
  exportFilename,
}: {
  title: string;
  liveBadgeLabel?: string;
  /** Shown next to the value in the tooltip, e.g. "SHT31", "BMP360". */
  sensorLabel: string;
  unit: string;
  trend: TrendPoint[];
  lineColorHex: string;
  fillGradientHex: string;
  bands?: TrendBand[];
  /** Fixed [min, max] for the y-axis instead of deriving it from the data
   * — used for wind direction, which is always 0-360°. */
  yDomain?: [number, number];
  yAxisFormatter?: (v: number) => string;
  valueFormatter?: (v: number) => string;
  exportFilename: string;
}) {
  const [windowHours, setWindowHours] = useState<number>(TOTAL_HOURS);
  const [windowStart, setWindowStart] = useState<number>(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const startIdx = Math.max(0, Math.min(TOTAL_HOURS - 1, Math.round(windowStart)));
  const endIdx = Math.max(startIdx + 1, Math.min(TOTAL_HOURS, Math.round(windowStart + windowHours)));
  const windowedTrend = trend.slice(startIdx, endIdx);
  const values = windowedTrend.map((p) => p.y);

  const points = useMemo(() => scaleSeries(values, VIEW_W, VIEW_H, 10), [values]);
  const line = smoothLinePath(points);
  const fill = areaPath(line, points, VIEW_H);

  const isLatestWindow = endIdx >= TOTAL_HOURS;
  const activeIndex = hoverIndex ?? values.length - 1;
  const activePoint = points[activeIndex];
  const activeTime = new Date(windowedTrend[activeIndex]?.x ?? Date.now()).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const [domainMin, domainMax] = yDomain ?? [
    values.length ? Math.min(...values) : 0,
    values.length ? Math.max(...values) : 0,
  ];
  const fmtY = yAxisFormatter ?? ((v: number) => `${Math.round(v)}${unit}`);
  const fmtV = valueFormatter ?? ((v: number) => `${v}${unit}`);
  const yLabels = [
    domainMax,
    domainMax - (domainMax - domainMin) / 3,
    domainMax - (2 * (domainMax - domainMin)) / 3,
    domainMin,
  ];

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const idx = Math.round(fraction * (values.length - 1));
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
    const header = ["Time", `${sensorLabel} (${unit})`];
    const rows = windowedTrend.map((p, i) => [
      new Date(p.x).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
      values[i],
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportFilename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-card-bg rounded-2xl p-7 border border-border-line shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-border-line">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-xs">
              {liveBadgeLabel}
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

      {trend.length === 0 ? (
        <OfflineCardBody
          label={`${sensorLabel} Offline`}
          detail="No readings available yet for this sensor."
        />
      ) : (
      <>
      {bands && bands.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 lg:gap-6 py-3 px-4 rounded-xl bg-[#090d16] border border-border-line my-5 font-mono text-xs">
          <span className="text-slate-500 font-medium">BANDS:</span>
          {bands.map((band) => (
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
      )}

      <div
        className={`relative w-full h-80 rounded-xl bg-[#080c14] border border-border-line p-4 overflow-hidden group ${
          bands && bands.length > 0 ? "" : "mt-5"
        }`}
        onMouseLeave={() => setHoverIndex(null)}
      >
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
            <linearGradient id={`grad-${exportFilename}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={fillGradientHex} stopOpacity="0.4" />
              <stop offset="100%" stopColor={fillGradientHex} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={fill} fill={`url(#grad-${exportFilename})`} />
          <path d={line} stroke={lineColorHex} strokeLinecap="round" strokeWidth={3} />
          {activePoint && (
            <>
              <line
                stroke={lineColorHex}
                strokeDasharray="3 3"
                strokeOpacity={0.5}
                strokeWidth={1.5}
                x1={activePoint.x}
                x2={activePoint.x}
                y1={0}
                y2={VIEW_H}
              />
              <circle cx={activePoint.x} cy={activePoint.y} fill={lineColorHex} r={6} stroke="#090d16" strokeWidth={3} />
            </>
          )}
        </svg>

        {activePoint && (
          <div
            className="absolute top-10 bg-[#121828]/95 backdrop-blur-md border border-border-line px-4 py-2.5 rounded-xl shadow-2xl font-mono text-xs pointer-events-none"
            style={{
              left: `${Math.min(85, Math.max(15, (activePoint.x / VIEW_W) * 100))}%`,
              transform: "translateX(-50%)",
              borderColor: `${lineColorHex}66`,
            }}
          >
            <div className="text-slate-400 text-[11px]">
              {activeTime} CAT {hoverIndex === null && "• LATEST"}
            </div>
            <div className="font-bold text-sm my-0.5" style={{ color: lineColorHex }}>
              {fmtV(values[activeIndex])}{" "}
              <span className="text-[10px] text-slate-400 font-normal">({sensorLabel})</span>
            </div>
          </div>
        )}

        <div className="absolute left-3 top-3 bottom-3 flex flex-col justify-between font-mono text-[11px] text-slate-500 pointer-events-none">
          {yLabels.map((v, i) => (
            <span key={i}>{fmtY(v)}</span>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between font-mono text-xs text-slate-400">
          <span>
            {new Date(windowedTrend[0]?.x ?? Date.now()).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}{" "}
            CAT (START)
          </span>
          <span className="text-cyan-300 font-semibold">
            {isLatestWindow ? `SHOWING LAST ${Math.round(windowHours)}H` : `PANNED — ${Math.round(windowHours)}H WINDOW`}
          </span>
          <span>
            {new Date(windowedTrend[windowedTrend.length - 1]?.x ?? Date.now()).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}{" "}
            CAT {isLatestWindow ? "(NOW)" : ""}
          </span>
        </div>
        {/* Drag-to-pan / drag-to-resize window slider — drag the highlighted
            block to scrub through the day, or either edge to resize it. */}
        <div
          ref={trackRef}
          className="relative w-full h-8 bg-[#080c14] border border-border-line rounded-lg p-1 flex items-center touch-none select-none"
        >
          <div
            onPointerDown={handlePointerDown("move")}
            className="absolute h-6 border rounded flex items-center justify-between px-2 cursor-grab active:cursor-grabbing"
            style={{
              left: `${(windowStart / TOTAL_HOURS) * 100}%`,
              width: `${(windowHours / TOTAL_HOURS) * 100}%`,
              backgroundColor: `${lineColorHex}22`,
              borderColor: `${lineColorHex}66`,
            }}
          >
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                handlePointerDown("resize-left")(e);
              }}
              className="w-2 h-full -ml-1 flex items-center justify-center cursor-ew-resize"
            >
              <div className="w-1 h-3.5 rounded-sm" style={{ backgroundColor: lineColorHex }} />
            </div>
            <span
              className="font-mono text-[10px] font-bold uppercase tracking-widest select-none pointer-events-none"
              style={{ color: lineColorHex }}
            >
              PAN {Math.round(windowHours)}H
            </span>
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                handlePointerDown("resize-right")(e);
              }}
              className="w-2 h-full -mr-1 flex items-center justify-center cursor-ew-resize"
            >
              <div className="w-1 h-3.5 rounded-sm" style={{ backgroundColor: lineColorHex }} />
            </div>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}