"use client";

import { useMemo } from "react";
import { useStationContext } from "@/lib/StationContext";
import { MOCK_STATION_DATA } from "@/lib/mockStationData";
import { getLiveTelemetryExtras } from "@/lib/liveTelemetryData";
import HeroMetricsRow from "@/components/dashboard/live/HeroMetricsRow";
import DiurnalCycleCard from "@/components/dashboard/live/DiurnalCycleCard";
import DualGaugeRainfallCard from "@/components/dashboard/live/DualGaugeRainfallCard";
import FullDayTrendCard from "@/components/dashboard/live/FullDayTrendCard";
import SensorTriadCard from "@/components/dashboard/live/SensorTriadCard";
import AnemometerCard from "@/components/dashboard/live/AnemometerCard";
import SynopticOutlookCard from "@/components/dashboard/live/SynopticOutlookCard";
import TelemetryLogTable from "@/components/dashboard/live/TelemetryLogTable";
import { degToCompass } from "@/lib/liveTelemetryData";

/**
 * Live Telemetry Dashboard — rebuilt to match the Stitch redesign
 * (live_station_telemetry_dashboard_redesigned) exactly. This screen is
 * also the source of truth for the shared header (see AppHeader.tsx).
 *
 * This used to be a customizable drag-and-drop widget grid with an inline
 * station map/list and a "Compare Stations" mode built into the page. The
 * redesign replaces all of that with this fixed analytical layout, and
 * moves station selection to the header (StationDropdown.tsx) and station
 * management to its own screen (app/(protected)/stations/page.tsx, which
 * already had its own map/list — nothing was lost by removing the
 * duplicate copy that used to live here). Station comparison will get its
 * own screen too, once we get to that Stitch design
 * (multi_station_comparison_correlation_redesigned).
 */
export default function DashboardPage() {
  const { selectedStationId } = useStationContext();

  const data = useMemo(
    () => MOCK_STATION_DATA[selectedStationId] ?? MOCK_STATION_DATA["1"],
    [selectedStationId]
  );
  const extras = useMemo(() => getLiveTelemetryExtras(selectedStationId), [selectedStationId]);

  return (
    <div className="space-y-8">
      <HeroMetricsRow data={data} extras={extras} />

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-8 space-y-8">
          <DiurnalCycleCard data={data} extras={extras} />
          <DualGaugeRainfallCard data={data} extras={extras} />
          <FullDayTrendCard
            title="RELATIVE HUMIDITY // FULL DIURNAL CYCLE"
            sensorLabel="SHT31"
            unit="%"
            trend={data.fullDayHumidityTrend}
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
            trend={data.fullDayPressureTrend}
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
            trend={data.fullDayWindDirectionTrend}
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
          <SensorTriadCard data={data} />
          <AnemometerCard extras={extras} />
          <SynopticOutlookCard extras={extras} />
        </div>
      </section>

      <TelemetryLogTable extras={extras} />
    </div>
  );
}