"use client";

import { useMemo, useState } from "react";
import type { Station } from "@/lib/types";
import { scaleSeries, smoothLinePath, areaPath } from "@/lib/chartPaths";
import { OFFLINE_COLOR } from "@/lib/compareData";

interface SeriesInput {
  station: Station;
  values: number[];
  color: string;
}

export default function MultiStationTrendChart({
  title,
  subtitle,
  series,
  unit,
  hourLabels,
  height = 320,
  showArea = false,
  showPeakAnnotation = false,
  deltaBadge,
}: {
  title: string;
  subtitle: string;
  series: SeriesInput[];
  unit: string;
  hourLabels: string[];
  height?: number;
  showArea?: boolean;
  showPeakAnnotation?: boolean;
  deltaBadge?: { text: string; colorClass: string };
}) {
  const VIEW_W = 1000;
  const VIEW_H = 240;
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const online = series.filter((s) => s.station.status === "online");
  const offline = series.filter((s) => s.station.status === "offline");

  const scaled = useMemo(() => {
    // Shared Y range across every series (online + offline) so a real
    // gap between stations shows up as vertical separation instead of
    // each line being independently stretched to fill the chart height.
    const allValues = series.flatMap((s) => s.values);
    const range =
      allValues.length > 0
        ? { min: Math.min(...allValues), max: Math.max(...allValues) }
        : undefined;

    return series.map((s) => ({
      ...s,
      points: scaleSeries(s.values, VIEW_W, VIEW_H, 20, range),
    }));
  }, [series]);

  // Peak divergence: the hour where the top two ONLINE series differ most.
  let peakIdx: number | null = null;
  if (showPeakAnnotation && online.length >= 2) {
    const a = online[0].values;
    const b = online[1].values;
    let maxDiff = -Infinity;
    let idx = 0;
    a.forEach((v, i) => {
      const diff = Math.abs(v - (b[i] ?? v));
      if (diff > maxDiff) {
        maxDiff = diff;
        idx = i;
      }
    });
    peakIdx = idx;
  }

  const activeIdx = hoverIdx ?? peakIdx;

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const len = hourLabels.length;
    setHoverIdx(Math.round(fraction * (len - 1)));
  }

  return (
    <div className="bg-card-bg/90 backdrop-blur-xl rounded-xl p-5 shadow-xl flex flex-col gap-4 border border-border-line">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="font-bold text-white text-base">{title}</span>
          <span className="font-mono text-[11px] text-on-surface-variant">{subtitle}</span>
        </div>
        {deltaBadge && (
          <span className={`font-mono text-[11px] px-2.5 py-1 rounded bg-card-bg-subtle font-bold self-start ${deltaBadge.colorClass}`}>
            {deltaBadge.text}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-card-bg-subtle px-3 py-1.5 rounded font-mono text-[11px]">
        {online.map((s) => {
          const avg = s.values.length
            ? Number((s.values.reduce((a, v) => a + v, 0) / s.values.length).toFixed(1))
            : 0;
          return (
            <span key={s.station.id} className="flex items-center gap-1.5 text-white">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.station.name}: <strong style={{ color: s.color }}>{avg}{unit} avg</strong>
            </span>
          );
        })}
        {offline.map((s) => (
          <span key={s.station.id} className="flex items-center gap-1.5 text-on-surface-variant">
            <span className="w-3 h-1 rounded" style={{ backgroundColor: OFFLINE_COLOR }} />
            {s.station.name} (Cached Model)
          </span>
        ))}
      </div>

      <div
        className="relative w-full bg-[#080c14] rounded-lg p-3 overflow-hidden flex flex-col justify-between"
        style={{ height }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <svg
          className="w-full h-full cursor-crosshair"
          preserveAspectRatio="none"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          onMouseMove={handleMouseMove}
        >
          <defs>
            {scaled.map((s) => (
              <linearGradient key={s.station.id} id={`grad-${s.station.id}`} x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.22" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {[0.08, 0.27, 0.46, 0.65, 0.83].map((frac) => (
            <line
              key={frac}
              opacity={frac === 0.83 ? 0.8 : 0.5}
              stroke="#31353e"
              strokeDasharray={frac === 0.83 ? undefined : "4 4"}
              strokeWidth={1}
              x1={20}
              x2={VIEW_W - 20}
              y1={frac * VIEW_H}
              y2={frac * VIEW_H}
            />
          ))}

          {showArea &&
            scaled
              .filter((s) => s.station.status === "online")
              .map((s) => (
                <path key={`area-${s.station.id}`} d={areaPath(smoothLinePath(s.points), s.points, VIEW_H)} fill={`url(#grad-${s.station.id})`} />
              ))}

          {scaled.map((s) => (
            <path
              key={s.station.id}
              d={smoothLinePath(s.points)}
              fill="none"
              opacity={s.station.status === "offline" ? 0.6 : 1}
              stroke={s.color}
              strokeDasharray={s.station.status === "offline" ? "6 6" : undefined}
              strokeLinecap="round"
              strokeWidth={s.station.status === "offline" ? 1.75 : 2.5}
            />
          ))}

          {activeIdx !== null && (
            <>
              <line
                opacity={0.6}
                stroke="#00e5ff"
                strokeDasharray="3 3"
                strokeWidth={1}
                x1={scaled[0]?.points[activeIdx]?.x ?? 0}
                x2={scaled[0]?.points[activeIdx]?.x ?? 0}
                y1={20}
                y2={VIEW_H - 20}
              />
              {online.map((s, i) => {
                const pt = scaled.find((sc) => sc.station.id === s.station.id)?.points[activeIdx];
                return pt ? <circle key={i} cx={pt.x} cy={pt.y} fill={s.color} r={4.5} /> : null;
              })}
            </>
          )}
        </svg>

        {activeIdx !== null && online.length > 0 && (
          <div
            className="absolute top-6 bg-card-bg-subtle/95 backdrop-blur-md p-2.5 rounded shadow-lg flex flex-col gap-0.5 pointer-events-none font-mono text-[11px]"
            style={{
              left: `${Math.min(80, Math.max(10, ((scaled[0]?.points[activeIdx]?.x ?? 0) / VIEW_W) * 100))}%`,
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-on-surface-variant">
                {hoverIdx === null ? "PEAK DIVERGENCE" : "AT"} ({hourLabels[activeIdx]})
              </span>
              {online.length >= 2 && (
                <span className="text-secondary font-bold">
                  {Math.abs(
                    Number(
                      (
                        (online[0].values[activeIdx] ?? 0) - (online[1].values[activeIdx] ?? 0)
                      ).toFixed(1)
                    )
                  )}
                  {unit} Δ
                </span>
              )}
            </div>
            {online.map((s) => (
              <div key={s.station.id} style={{ color: s.color }}>
                {s.station.name}: {s.values[activeIdx]}
                {unit}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center px-2 font-mono text-[10px] text-on-surface-variant">
          {/* hourLabels' length must match the data series (hover-index
              math above depends on it) but with 24 points rendering
              every single one as a tick is unreadable — sample down to
              roughly 8 evenly-spaced ticks instead, always including the
              first and last. */}
          {hourLabels
            .map((label, i) => ({ label, i }))
            .filter(({ i }) => {
              const step = Math.max(1, Math.ceil(hourLabels.length / 8));
              return i === 0 || i === hourLabels.length - 1 || i % step === 0;
            })
            .map(({ label, i }) => (
              <span key={i}>{label}</span>
            ))}
        </div>
      </div>
    </div>
  );
}