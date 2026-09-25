import type { StationMockData } from "@/lib/mockStationData";
import type { LiveTelemetryExtras } from "@/lib/liveTelemetryData";
import { scaleSeries, smoothLinePath, areaPath } from "@/lib/chartPaths";

function Sparkline({ values, colorClass }: { values: number[]; colorClass: string }) {
  const points = scaleSeries(values, 120, 30, 3);
  const line = smoothLinePath(points);
  const fill = areaPath(line, points, 30);
  return (
    <div className="w-full h-10 mb-2">
      <svg className={`w-full h-full ${colorClass}`} fill="none" preserveAspectRatio="none" viewBox="0 0 120 30">
        <path d={line} stroke="currentColor" strokeLinecap="round" strokeWidth={2.5} />
        <path d={fill} fill="currentColor" fillOpacity={0.12} />
      </svg>
    </div>
  );
}

const cardShell =
  "bg-card-bg rounded-2xl p-6 border border-border-line hover:border-border-hover transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col justify-between group";

export default function HeroMetricsRow({
  data,
  extras,
}: {
  data: StationMockData;
  extras: LiveTelemetryExtras;
}) {
  const t = data.tempHistory;
  const tempTrendPerHr =
    t.length >= 2 ? Number((t[t.length - 1] - t[t.length - 2]).toFixed(1)) : 0;
  const diurnalDelta = Number((data.current.todayHigh - data.current.todayLow).toFixed(1));

  const h = data.humidityHistory;
  const humidityLabel = data.current.humidity > 80 ? "HIGH" : data.current.humidity < 30 ? "LOW" : "NOMINAL";

  const minute = data.rainByGranularity.minute;
  const g1Now = minute.gauge1[minute.gauge1.length - 1];
  const g2Now = minute.gauge2[minute.gauge2.length - 1];
  const rain24h = data.current.rollAvgRain_mm;
  const maxBucket = Math.max(...extras.rain6hBuckets, 0.1);

  const pressureRangeMin = 990;
  const pressureRangeMax = 1030;
  const pressurePct = Math.min(
    100,
    Math.max(
      0,
      ((data.current.pressure - pressureRangeMin) / (pressureRangeMax - pressureRangeMin)) * 100
    )
  );
  const pressureHigh = Math.max(...data.pressureHistory);
  const pressureLow = Math.min(...data.pressureHistory);

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {/* Card 1: Air Temperature */}
      <div className={cardShell}>
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-border-line">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">device_thermostat</span>
              </div>
              <div>
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Air Temp
                </span>
                <span className="text-[11px] font-mono text-slate-500 block">MCP9808</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-300 font-mono text-xs font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">
                {tempTrendPerHr >= 0 ? "trending_up" : "trending_down"}
              </span>
              {tempTrendPerHr >= 0 ? "+" : ""}
              {tempTrendPerHr}°C/hr
            </span>
          </div>
          <div className="mt-5 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-sans">
                {data.current.airTemp}
              </span>
              <span className="text-2xl font-bold text-secondary font-mono">°C</span>
            </div>
            <div className="text-right font-mono text-xs space-y-1">
              <div className="text-slate-400">
                MAX: <strong className="text-amber-400 font-bold">{data.current.todayHigh}°C</strong>
              </div>
              <div className="text-slate-400">
                MIN: <strong className="text-cyan-300 font-bold">{data.current.todayLow}°C</strong>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 pt-3 border-t border-slate-800/60">
          <Sparkline values={t} colorClass="text-secondary" />
          <div className="flex items-center justify-between font-mono text-xs text-slate-400">
            <span>Diurnal Range Delta</span>
            <span className="text-slate-200 font-bold">{diurnalDelta}°C</span>
          </div>
        </div>
      </div>

      {/* Card 2: Relative Humidity */}
      <div className={cardShell}>
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-border-line">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">humidity_percentage</span>
              </div>
              <div>
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Relative Humidity
                </span>
                <span className="text-[11px] font-mono text-slate-500 block">SHT31 SENSOR</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 font-mono text-xs font-semibold">
              {humidityLabel}
            </span>
          </div>
          <div className="mt-5 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl lg:text-5xl font-extrabold tracking-tight text-cyan-300 font-sans">
                {data.current.humidity}
              </span>
              <span className="text-2xl font-bold text-cyan-400 font-mono">%</span>
            </div>
            <div className="text-right font-mono text-xs space-y-1">
              <div className="text-slate-400">DEW POINT</div>
              <div className="text-base text-white font-bold">{extras.dewPoint}°C</div>
            </div>
          </div>
        </div>
        <div className="mt-5 pt-3 border-t border-slate-800/60">
          <Sparkline values={h} colorClass="text-cyan-400" />
          <div className="flex items-center justify-between font-mono text-xs text-slate-400">
            <span>Vapor Pressure</span>
            <span className="text-slate-200 font-bold">{extras.vaporPressureKPa} kPa</span>
          </div>
        </div>
      </div>

      {/* Card 3: Rainfall (Rolling & Cumulative) */}
      <div className={cardShell}>
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-border-line">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">rainy</span>
              </div>
              <div>
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Rainfall (Rolling)
                </span>
                <span className="text-[11px] font-mono text-slate-500 block">DUAL-GAUGE SYNC</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-cyan-500/15 text-cyan-300 font-mono text-xs font-semibold">
              {data.current.minAvgRain_mm} mm/min
            </span>
          </div>
          <div className="mt-5 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-sans">
                {data.current.rollAvgRain_mm}
              </span>
              <span className="text-2xl font-bold text-slate-400 font-mono">mm</span>
            </div>
            <div className="text-right font-mono text-xs space-y-1">
              <div className="text-slate-400">
                G1: <span className="text-cyan-300 font-semibold">{g1Now}mm</span>
              </div>
              <div className="text-slate-400">
                G2: <span className="text-purple-300 font-semibold">{g2Now}mm</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 pt-3 border-t border-slate-800/60">
          <div className="w-full h-10 mb-2 flex items-end gap-1.5 px-1">
            {extras.rain6hBuckets.map((v, i) => {
              const pct = Math.max(8, (v / maxBucket) * 100);
              const isPeak = v === Math.max(...extras.rain6hBuckets);
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-sm transition-all ${
                    isPeak
                      ? "bg-cyan-500 shadow-[0_0_8px_rgba(0,229,255,0.3)]"
                      : v > 0
                      ? "bg-cyan-400/70"
                      : "bg-slate-800"
                  }`}
                  style={{ height: `${pct}%` }}
                  title={`${v}mm`}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-between font-mono text-xs text-slate-400">
            <span>Rolling Accumulation</span>
            <span className="text-slate-200 font-bold">{rain24h} mm</span>
          </div>
        </div>
      </div>

      {/* Card 4: Pressure */}
      <div className={cardShell}>
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-border-line">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">compress</span>
              </div>
              <div>
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Pressure
                </span>
                <span className="text-[11px] font-mono text-slate-500 block">BMP360</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-purple-500/15 text-purple-300 font-mono text-xs font-semibold">
              {extras.pressureTrend3h >= 0 ? "+" : ""}
              {extras.pressureTrend3h} hPa / 3h
            </span>
          </div>
          <div className="mt-5 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-sans">
                {data.current.pressure}
              </span>
              <span className="text-xl font-bold text-tertiary font-mono">hPa</span>
            </div>
            <div className="text-right font-mono text-xs space-y-1">
              <div className="text-slate-400">
                HIGH: <strong className="text-amber-400 font-bold">{pressureHigh.toFixed(1)}</strong>
              </div>
              <div className="text-slate-400">
                LOW: <strong className="text-cyan-300 font-bold">{pressureLow.toFixed(1)}</strong>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 pt-3 border-t border-slate-800/60">
          <div className="w-full h-10 mb-2 flex items-center">
            <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-400 rounded-full"
                style={{ width: `${pressurePct}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between font-mono text-xs text-slate-400">
            <span>MSL Normalized</span>
            <span className="text-emerald-400 font-bold">{extras.pressureStabilityLabel}</span>
          </div>
        </div>
      </div>
    </section>
  );
}