"use client";

import { useMemo } from "react";
import { useStationContext } from "@/lib/StationContext";
import { MOCK_STATION_DATA } from "@/lib/mockStationData";
import { getLiveTelemetryExtras } from "@/lib/liveTelemetryData";
import HeroMetricsRow from "@/components/dashboard/live/HeroMetricsRow";
import DiurnalCycleCard from "@/components/dashboard/live/DiurnalCycleCard";
import DualGaugeRainfallCard from "@/components/dashboard/live/DualGaugeRainfallCard";
import SensorTriadCard from "@/components/dashboard/live/SensorTriadCard";
import AnemometerCard from "@/components/dashboard/live/AnemometerCard";
import SynopticOutlookCard from "@/components/dashboard/live/SynopticOutlookCard";
import TelemetryLogTable from "@/components/dashboard/live/TelemetryLogTable";

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
        </div>
        <div className="xl:col-span-4 space-y-8">
          <SensorTriadCard data={data} />
          <AnemometerCard extras={extras} />
          <SynopticOutlookCard extras={extras} />
        </div>
      </section>

      <TelemetryLogTable extras={extras} />
    </div>
  );
}