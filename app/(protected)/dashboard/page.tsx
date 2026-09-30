"use client";

import { useStationContext } from "@/lib/StationContext";
import { useLiveTelemetry } from "@/lib/useLiveTelemetry";
import { degToCompass } from "@/lib/liveTelemetryData";
import DashboardLoading from "./loading";
import HeroMetricsRow from "@/components/dashboard/live/HeroMetricsRow";
import DiurnalCycleCard from "@/components/dashboard/live/DiurnalCycleCard";
import DualGaugeRainfallCard from "@/components/dashboard/live/DualGaugeRainfallCard";
import FullDayTrendCard from "@/components/dashboard/live/FullDayTrendCard";
import SensorTriadCard from "@/components/dashboard/live/SensorTriadCard";
import AnemometerCard from "@/components/dashboard/live/AnemometerCard";
import SynopticOutlookCard from "@/components/dashboard/live/SynopticOutlookCard";
import TelemetryLogTable from "@/components/dashboard/live/TelemetryLogTable";

/**
 * Live Telemetry Dashboard — data comes from useLiveTelemetry (REST for the
 * initial load + history, WebSocket for live updates on top; see
 * lib/useLiveTelemetry.ts and lib/deriveStationView.ts). This screen is
 * also the source of truth for the shared header (see AppHeader.tsx).
 *
 * Two distinct "nothing to show" states, handled at different levels:
 * - The whole fetch failed or this station has never reported anything —
 *   handled right here, before any card renders at all.
 * - One sensor on an otherwise-fine station isn't reporting — a `null` in
 *   the derived data for just that field, handled inside each individual
 *   card (see components/layout/OfflineCardBody.tsx), not here.
 */
export default function DashboardPage() {
  const { selectedStationId } = useStationContext();
  const { view, extras, status, errorMessage, socketState, refetch } = useLiveTelemetry(selectedStationId);

  // Client-side re-fetch after the initial page load (e.g. switching
  // stations) isn't covered by loading.tsx, which only shows during route
  // navigation — reuse the same skeleton for that case here.
  if (status === "loading" || !view || !extras) {
    return <DashboardLoading />;
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <span className="material-symbols-outlined text-[36px] text-rose-400">cloud_off</span>
        <p className="text-white font-semibold">Couldn&apos;t reach the telemetry API</p>
        <p className="text-sm text-slate-400 max-w-sm">{errorMessage}</p>
        <button
          type="button"
          onClick={refetch}
          className="mt-2 px-4 py-2 rounded-lg bg-primary-container text-slate-950 font-bold text-sm hover:bg-primary transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (status === "offline") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <span className="material-symbols-outlined text-[36px] text-slate-500">sensors_off</span>
        <p className="text-white font-semibold">This station hasn&apos;t reported any data</p>
        <p className="text-sm text-slate-400 max-w-sm">
          The API is reachable, but no telemetry has ever been received for this station.
        </p>
        <button
          type="button"
          onClick={refetch}
          className="mt-2 px-4 py-2 rounded-lg bg-card-bg-subtle border border-border-line text-slate-300 font-semibold text-sm hover:bg-slate-800 transition-colors"
        >
          Check again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {socketState !== "open" && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 font-mono text-xs">
          <span className="material-symbols-outlined text-[16px] animate-pulse">sync_problem</span>
          {socketState === "connecting" ? "Reconnecting live feed…" : "Live feed disconnected — showing last fetched data."}
        </div>
      )}

      <HeroMetricsRow data={view} extras={extras} />

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-8 space-y-8">
          <DiurnalCycleCard data={view} extras={extras} />
          <DualGaugeRainfallCard data={view} extras={extras} />
          <FullDayTrendCard
            title="RELATIVE HUMIDITY // FULL DIURNAL CYCLE"
            sensorLabel="SHT31"
            unit="%"
            trend={view.fullDayHumidityTrend}
            lineColorHex="#22d3ee"
            fillGradientHex="#22d3ee"
            yDomain={[0, 100]}
            exportFilename="humidity-diurnal-curve.csv"
            bands={[
              { label: "Dry (<30%)", swatch: "bg-amber-400" },
              { label: "Comfortable (30-60%)", swatch: "bg-emerald-400" },
              { label: "Humid (60-80%)", swatch: "bg-cyan-400" },
              { label: "Saturated (>80%)", swatch: "bg-blue-500", emphasize: true },
            ]}
          />
          <FullDayTrendCard
            title="BAROMETRIC PRESSURE // FULL DIURNAL CYCLE"
            sensorLabel="BMP360"
            unit=" hPa"
            trend={view.fullDayPressureTrend}
            lineColorHex="#a855f7"
            fillGradientHex="#a855f7"
            exportFilename="pressure-diurnal-curve.csv"
            bands={[
              { label: "Low (<1008 hPa)", swatch: "bg-cyan-400" },
              { label: "Normal (1008-1018 hPa)", swatch: "bg-emerald-400" },
              { label: "High (>1018 hPa)", swatch: "bg-amber-400" },
            ]}
          />
          <FullDayTrendCard
            title="WIND DIRECTION // FULL DIURNAL CYCLE"
            sensorLabel="Wind Vane"
            unit="°"
            trend={view.fullDayWindDirectionTrend}
            lineColorHex="#34d399"
            fillGradientHex="#34d399"
            yDomain={[0, 360]}
            yAxisFormatter={(v) => `${Math.round(v)}° ${degToCompass(v)}`}
            valueFormatter={(v) => `${v}° (${degToCompass(v)})`}
            exportFilename="wind-direction-diurnal-curve.csv"
          />
        </div>
        {/* Sticks in place once its own content has scrolled past, so it
            stays visible next to the extra graphs (humidity/pressure/wind
            direction) that make the left column run taller than this one.
            top-24 clears the sticky app header (h-20) with a small gap. */}
        <div className="xl:col-span-4 space-y-8 xl:sticky xl:top-24 xl:self-start">
          <SensorTriadCard data={view} />
          <AnemometerCard extras={extras} />
          <SynopticOutlookCard extras={extras} />
        </div>
      </section>

      <TelemetryLogTable extras={extras} />
    </div>
  );
}