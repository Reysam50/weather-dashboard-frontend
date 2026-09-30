"use client";

import { useEffect, useRef, useState } from "react";
import type { LiveTelemetryExtras } from "@/lib/liveTelemetryData";
import { degToCompass } from "@/lib/liveTelemetryData";
import { OfflineCardBody } from "@/components/layout/OfflineCardBody";

/**
 * The needle's direction/speed animate — nudging around the station's real
 * reading every couple of seconds, with the SVG transform's CSS transition
 * doing the smooth turning between values instead of snapping. When the
 * wind sensor isn't reporting (speedKmh/directionDeg both null — expected
 * default state until the hardware team's confirmed-forthcoming wind
 * sensor actually starts sending data, see lib/types.ts), the animation
 * just idles rather than nudging around a fabricated baseline.
 */
export default function AnemometerCard({ extras }: { extras: LiveTelemetryExtras }) {
  const { speedKmh: baseSpeed, gustKmh, gustSpreadKmh, directionDeg: baseDeg, bearingStable } = extras.wind;
  const hasWind = baseSpeed !== null && baseDeg !== null;

  const [liveDeg, setLiveDeg] = useState(baseDeg ?? 0);
  const [liveSpeed, setLiveSpeed] = useState(baseSpeed ?? 0);
  const degRef = useRef(baseDeg ?? 0);
  const speedRef = useRef(baseSpeed ?? 0);

  // Re-center on the station's real reading when it changes (e.g.
  // switching stations), instead of animating from a stale value.
  useEffect(() => {
    degRef.current = baseDeg ?? 0;
    speedRef.current = baseSpeed ?? 0;
    setLiveDeg(baseDeg ?? 0);
    setLiveSpeed(baseSpeed ?? 0);
  }, [baseDeg, baseSpeed]);

  useEffect(() => {
    if (!hasWind) return; // nothing real to wander around
    const id = setInterval(() => {
      // Random nudge each tick, gently pulled back toward the real
      // reading so it wanders realistically without drifting away from
      // it. Deliberately NOT wrapped to 0-360 here — the pull term keeps
      // it naturally bounded near baseDeg, and keeping it unwrapped means
      // the CSS transition always turns the short way, instead of
      // occasionally spinning a full circle when crossing the 0°/360°
      // seam under modulo arithmetic.
      const degNudge = (Math.random() - 0.5) * 18;
      const pullToBase = ((baseDeg ?? 0) - degRef.current) * 0.15;
      degRef.current = degRef.current + degNudge + pullToBase;

      const speedNudge = (Math.random() - 0.5) * 1.4;
      const speedPull = ((baseSpeed ?? 0) - speedRef.current) * 0.2;
      speedRef.current = Math.max(0, speedRef.current + speedNudge + speedPull);

      setLiveDeg(degRef.current);
      setLiveSpeed(speedRef.current);
    }, 2200);
    return () => clearInterval(id);
  }, [baseDeg, baseSpeed, hasWind]);

  const displayDeg = ((liveDeg % 360) + 360) % 360;
  const liveCompass = degToCompass(displayDeg);

  return (
    <div className="bg-card-bg rounded-2xl p-7 border border-border-line shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
      <div className="flex items-center justify-between pb-4 border-b border-border-line">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[20px] text-secondary">air</span>
          <h3 className="font-bold text-white text-base tracking-tight">SURFACE ANEMOMETER</h3>
        </div>
        {hasWind && (
          <span className="font-mono text-xs font-bold text-secondary tabular-nums">
            AZIMUTH: {Math.round(displayDeg)}° ({liveCompass})
          </span>
        )}
      </div>

      {!hasWind ? (
        <OfflineCardBody
          label="Anemometer Offline"
          detail="Wind speed/direction sensor hasn't reported a reading yet."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 items-center gap-4 my-5">
            <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
              <svg className="w-full h-full text-slate-700" viewBox="0 0 100 100">
                <circle cx={50} cy={50} fill="transparent" r={46} stroke="currentColor" strokeWidth={1.5} />
                <circle
                  cx={50}
                  cy={50}
                  fill="transparent"
                  r={32}
                  stroke="currentColor"
                  strokeDasharray="2 2"
                  strokeWidth={1}
                />
                <circle
                  cx={50}
                  cy={50}
                  fill="transparent"
                  r={18}
                  stroke="currentColor"
                  strokeDasharray="1 3"
                  strokeWidth={1}
                />
                <text fill="#94a3b8" fontFamily="JetBrains Mono" fontSize={7} fontWeight="bold" textAnchor="middle" x={50} y={13}>
                  N
                </text>
                <text fill="#ffb95f" fontFamily="JetBrains Mono" fontSize={7} fontWeight="bold" textAnchor="middle" x={89} y={52.5}>
                  E
                </text>
                <text fill="#94a3b8" fontFamily="JetBrains Mono" fontSize={7} fontWeight="bold" textAnchor="middle" x={50} y={92}>
                  S
                </text>
                <text fill="#94a3b8" fontFamily="JetBrains Mono" fontSize={7} fontWeight="bold" textAnchor="middle" x={12} y={52.5}>
                  W
                </text>
                <g
                  style={{ transform: `rotate(${liveDeg}deg)`, transformOrigin: "50px 50px" }}
                  className="transition-transform duration-[2000ms] ease-in-out"
                >
                  <polygon fill="#00e5ff" points="50,14 54,50 46,50" />
                  <polygon fill="#64748b" opacity={0.6} points="50,86 53,50 47,50" />
                  <circle cx={50} cy={50} fill="#ffb95f" r={3.5} />
                </g>
              </svg>
            </div>

            <div className="space-y-3 font-mono">
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Current Velocity</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-cyan-300 font-sans tabular-nums transition-all duration-500">
                    {liveSpeed.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-400">km/h</span>
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Max Sustained Gust</span>
                <span className="text-lg font-bold text-secondary">
                  {gustKmh ?? "—"} <span className="text-xs text-slate-400 font-normal">km/h</span>
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                GUST SPREAD: <strong className="text-white">{gustSpreadKmh !== null ? `+${gustSpreadKmh}` : "—"} km/h</strong>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/60">
            {extras.windSpeedHistory.length > 0 && (
              <div className="w-full h-8 mb-2 flex items-end gap-1">
                {extras.windSpeedHistory.map((v, i) => {
                  const max = Math.max(...extras.windSpeedHistory, 0.1);
                  const pct = Math.max(10, (v / max) * 100);
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-cyan-400/60"
                      style={{ height: `${pct}%` }}
                      title={`${v} km/h`}
                    />
                  );
                })}
              </div>
            )}
            <div className="flex items-center justify-between font-mono text-xs text-slate-400">
              <span>SONIC PATH: UNIMPEDED</span>
              <span className="text-cyan-300 font-medium">
                {bearingStable ? "BEARING STABLE" : "BEARING SHIFTING"}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}