import type { StationMockData } from "@/lib/mockStationData";
import type { LiveTelemetryExtras } from "@/lib/liveTelemetryData";

export default function SensorTriadCard({
  data,
  extras,
}: {
  data: StationMockData;
  extras: LiveTelemetryExtras;
}) {
  const airExt = data.current.airTemp;
  const bmp = data.bmpTempHistory[data.bmpTempHistory.length - 1];
  const sht = data.shtTempHistory[data.shtTempHistory.length - 1];

  // Donut segment lengths: sensors closer to the weighted median get a
  // bigger slice of the ring, normalized to sum to 90 (leaving a visible
  // gap) — same visual idea as the design's fixed 31/29/28 split, just
  // computed from the actual per-station offsets instead of hardcoded.
  const mean = extras.weightedMedianC;
  const inv = (v: number) => 1 / (Math.abs(v - mean) + 0.05);
  const weights = [inv(airExt), inv(bmp), inv(sht)];
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const [airLen, bmpLen, shtLen] = weights.map((w) => Number(((w / totalWeight) * 90).toFixed(0)));

  const qaColor =
    extras.qaAssessment === "OPTIMAL"
      ? "text-emerald-400 bg-emerald-500/10"
      : extras.qaAssessment === "ACCEPTABLE"
      ? "text-amber-300 bg-amber-500/10"
      : "text-rose-400 bg-rose-500/10";

  return (
    <div className="bg-card-bg rounded-2xl p-7 border border-border-line shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
      <div className="flex items-center justify-between pb-4 border-b border-border-line">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[20px] text-cyan-400">flaky</span>
          <h3 className="font-bold text-white text-base tracking-tight">SENSOR TRIAD AGREEMENT</h3>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-card-bg-subtle border border-cyan-500/30 text-cyan-300 font-mono text-[11px]">
          TOLERANCE ±0.8°C
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 my-5 font-mono">
        <div className="p-3 rounded-xl bg-[#090d16] border border-border-line flex flex-col items-center text-center">
          <span className="text-[11px] text-secondary font-semibold">AIR (EXT)</span>
          <span className="text-xl font-bold text-white my-1">{airExt}°</span>
          <span className="text-[10px] text-emerald-400 font-semibold">
            OFFSET: {extras.sensorOffsets.air.toFixed(2)}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-[#090d16] border border-border-line flex flex-col items-center text-center">
          <span className="text-[11px] text-cyan-300 font-semibold">BMP280</span>
          <span className="text-xl font-bold text-white my-1">{bmp}°</span>
          <span className="text-[10px] text-slate-400">
            OFFSET: {extras.sensorOffsets.bmp >= 0 ? "+" : ""}
            {extras.sensorOffsets.bmp.toFixed(2)}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-[#090d16] border border-border-line flex flex-col items-center text-center">
          <span className="text-[11px] text-purple-300 font-semibold">SHT-31</span>
          <span className="text-xl font-bold text-white my-1">{sht}°</span>
          <span className="text-[10px] text-slate-400">
            OFFSET: {extras.sensorOffsets.sht >= 0 ? "+" : ""}
            {extras.sensorOffsets.sht.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-5 p-4 rounded-xl bg-[#090d16] border border-border-line">
        <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx={18} cy={18} fill="transparent" r={14} stroke="#1a233b" strokeWidth={4} />
            <circle
              cx={18}
              cy={18}
              fill="transparent"
              r={14}
              stroke="#ffb95f"
              strokeDasharray={`${airLen} 100`}
              strokeDashoffset={0}
              strokeWidth={4}
            />
            <circle
              cx={18}
              cy={18}
              fill="transparent"
              r={14}
              stroke="#00e5ff"
              strokeDasharray={`${bmpLen} 100`}
              strokeDashoffset={-airLen}
              strokeWidth={4}
            />
            <circle
              cx={18}
              cy={18}
              fill="transparent"
              r={14}
              stroke="#c084fc"
              strokeDasharray={`${shtLen} 100`}
              strokeDashoffset={-(airLen + bmpLen)}
              strokeWidth={4}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center font-mono leading-tight">
            <span className="text-xs font-bold text-white">{extras.cohesionPct}%</span>
            <span className="text-[8px] text-slate-400 uppercase">COHESION</span>
          </div>
        </div>
        <div className="flex-1 space-y-1.5 font-mono text-xs">
          <div className="flex justify-between items-center text-slate-400">
            <span>Weighted Median</span>
            <span className="text-white font-bold">{extras.weightedMedianC}°C</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Std Dev (σ)</span>
            <span className="text-cyan-300 font-bold">
              {extras.stdDevC}°C ({extras.stdDevC < 0.5 ? "Low" : extras.stdDevC < 1 ? "Moderate" : "High"})
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>QA Assessment</span>
            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${qaColor}`}>
              {extras.qaAssessment}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
