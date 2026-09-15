import type { LiveTelemetryExtras } from "@/lib/liveTelemetryData";

export default function AnemometerCard({ extras }: { extras: LiveTelemetryExtras }) {
  const { speedKmh, gustKmh, gustSpreadKmh, directionDeg, compass, bearingStable } = extras.wind;

  return (
    <div className="bg-card-bg rounded-2xl p-7 border border-border-line shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
      <div className="flex items-center justify-between pb-4 border-b border-border-line">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[20px] text-secondary">air</span>
          <h3 className="font-bold text-white text-base tracking-tight">SURFACE ANEMOMETER</h3>
        </div>
        <span className="font-mono text-xs font-bold text-secondary">
          AZIMUTH: {directionDeg}° ({compass})
        </span>
      </div>

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
            <g transform={`rotate(${directionDeg} 50 50)`}>
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
              <span className="text-3xl font-extrabold text-cyan-300 font-sans">{speedKmh}</span>
              <span className="text-xs text-slate-400">km/h</span>
            </div>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Max Sustained Gust</span>
            <span className="text-lg font-bold text-secondary">
              {gustKmh} <span className="text-xs text-slate-400 font-normal">km/h</span>
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            GUST SPREAD: <strong className="text-white">+{gustSpreadKmh} km/h</strong>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between font-mono text-xs text-slate-400 pt-3 border-t border-slate-800/60">
        <span>SONIC PATH: UNIMPEDED</span>
        <span className="text-cyan-300 font-medium">
          {bearingStable ? "BEARING STABLE" : "BEARING SHIFTING"}
        </span>
      </div>
    </div>
  );
}
