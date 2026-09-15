import type { LiveTelemetryExtras } from "@/lib/liveTelemetryData";

export default function SynopticOutlookCard({ extras }: { extras: LiveTelemetryExtras }) {
  return (
    <div className="bg-card-bg rounded-2xl p-7 border border-border-line shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
      <div className="flex items-center justify-between pb-4 border-b border-border-line">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[20px] text-secondary">cloud_sync</span>
          <h3 className="font-bold text-white text-base tracking-tight">SYNOPTIC 7-DAY OUTLOOK</h3>
        </div>
        <span className="px-2 py-0.5 rounded bg-card-bg-subtle text-amber-300 font-mono text-[11px]">
          ECMWF / GFS
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1.5 my-5 font-mono text-center">
        {extras.forecast7Day.map((day, i) => (
          <div
            key={i}
            className={`p-2 rounded-xl flex flex-col items-center justify-between ${
              i === 0
                ? "bg-amber-500/10 border border-amber-500/30"
                : "bg-[#090d16] border border-border-line"
            }`}
          >
            <span className={`font-bold text-xs ${i === 0 ? "text-amber-400" : "text-slate-400 font-medium"}`}>
              {day.label}
            </span>
            <span className={`material-symbols-outlined text-[22px] my-1.5 ${day.iconColor}`}>
              {day.icon}
            </span>
            <span className="text-white font-bold text-xs">{day.high}°</span>
            <span className="text-slate-400 text-[10px]">{day.low}°</span>
            <span
              className={`text-[9px] mt-1 ${day.rainMm > 0 ? "text-cyan-300 font-semibold" : "text-slate-500"}`}
            >
              {day.rainMm}mm
            </span>
          </div>
        ))}
      </div>

      <div className="p-3.5 rounded-xl bg-[#090d16] border border-border-line flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[20px] text-secondary">solar_power</span>
          <div>
            <span className="text-white font-bold block">SOLAR NOON PEAK</span>
            <span className="text-slate-500 text-[11px]">{extras.solarNoonPeakWm2} W/m² GHI</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-secondary font-bold block">UV INDEX {extras.uvIndex}.0</span>
          <span className="text-emerald-400 text-[11px]">{extras.uvCategory} REQ</span>
        </div>
      </div>
    </div>
  );
}
