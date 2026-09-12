"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";

import SortableWidget from "@/components/dashboard/SortableWidget";
import CompareStationsPanel from "@/components/dashboard/CompareStationsPanel";
import CompareMetricsPanel from "@/components/dashboard/CompareMetricsPanel";
import ComparisonChart from "@/components/dashboard/ComparisonChart";
import ComparisonTable from "@/components/dashboard/ComparisonTable";
import { COMPARISON_METRICS } from "@/lib/comparisonMetrics";
import BigNumberCard from "@/components/widgets/BigNumberCard";
import RainfallComparisonChart from "@/components/widgets/RainfallComparisonChart";
import SensorBandChart from "@/components/widgets/SensorBandChart";
import DailySummaryTable from "@/components/widgets/DailySummaryTable";
import TemperatureTrendChart from "@/components/widgets/TemperatureTrendChart";
import StationSummaryTable from "@/components/widgets/StationSummaryTable";
import RawReadingsTable from "@/components/widgets/RawReadingsTable";
import MultiSeriesLineChart from "@/components/widgets/MultiSeriesLineChart";
import SingleMetricChart from "@/components/widgets/SingleMetricChart";
import DirectionScatterChart from "@/components/widgets/DirectionScatterChart";
import AccumulationRateChart from "@/components/widgets/AccumulationRateChart";
import StationList from "@/components/map/StationList";
import AddStationForm from "@/components/map/AddStationForm";
import type { Station } from "@/lib/types";
import { MOCK_STATION_DATA } from "@/lib/mockStationData";
import { mockStations } from "@/lib/mockStations";
import { CURRENT_ROLE, ASSIGNED_STATION_ID } from "@/lib/mockAuth";
import { loadWidgetOrder, saveWidgetOrder } from "@/lib/dashboardLayout";
import { loadAdminSettings } from "@/lib/adminSettings";
import { DEFAULT_ENABLED_WIDGET_IDS } from "@/lib/widgetCatalog";
import { loadStationWidgetIds, reconcileWidgetOrder } from "@/lib/stationWidgetConfig";

// Leaflet needs `window`/`document` — same reason the ApexCharts widgets
// are loaded this way.
const StationMap = dynamic(() => import("@/components/map/StationMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center text-gray-500 text-sm bg-weather-card rounded-2xl border border-white/10">
      Loading map…
    </div>
  ),
});

/**
 * Main dashboard — station selector + per-station widget grid, together on
 * one page. Per FR-12.1: "A map-based station selector... shall be added
 * to the dashboard... selecting a station displays that station's details
 * on the dashboard" — the map lives here because the spec says so; an
 * earlier version of this app put it on its own /stations route, which
 * didn't actually match FR-12.
 *
 * Role-gated behavior (stakeholder-analysis.md / FR-12.3):
 * - Station Operator: no map/selector at all — sees only their one
 *   assigned station's data, fixed, no ability to switch.
 * - Administrator: sees the map/list selector, can pick any station, but
 *   "+ Add Station" does not render (read-only on FR-12).
 * - Technical Team: sees the selector AND station provisioning (add/edit).
 *
 * TODO (frontend developer):
 * - replace CURRENT_ROLE, mockStations, and MOCK_STATION_DATA with real
 *   data from GET /auth/me and the real stations/telemetry endpoints
 * - wire lib/websocket.ts so widgets update live for the selected station
 * - for Station Operator, ASSIGNED_STATION_ID should come from their user
 *   record (user_station_assignments table), not be hardcoded here
 */

/** localStorage key prefix for widget order — kept per-station now that
 * different stations can have different enabled widgets. */
function widgetOrderStorageKey(stationId: string) {
  return `main-dashboard:${stationId}`;
}

export default function DashboardPage() {
  const canSelectStation = CURRENT_ROLE !== "station_operator";
  const canManageStations = CURRENT_ROLE === "technical_team";

  const [stations, setStations] = useState<Station[]>(mockStations);
  const [selectedStationId, setSelectedStationId] = useState<string>(
    canSelectStation ? mockStations[0]?.id ?? "1" : ASSIGNED_STATION_ID
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingStation, setIsAddingStation] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Comparison mode — FR-2.2, Administrator/Technical Team only. Kept
  // entirely separate from selectedStationId/StationList's single-select
  // state so turning this on/off can't affect the normal single-station
  // dashboard view.
  const canCompare = CURRENT_ROLE !== "station_operator";
  const [compareMode, setCompareMode] = useState(false);
  const [compareStationIds, setCompareStationIds] = useState<string[]>([]);

  function toggleCompareStation(id: string) {
    setCompareStationIds((current) =>
      current.includes(id) ? current.filter((s) => s !== id) : [...current, id]
    );
  }

  const compareStations = compareStationIds
    .map((id) => stations.find((s) => s.id === id))
    .filter((s): s is Station => Boolean(s));

  // Which metrics to compare — defaults to just Temperature so the view
  // isn't empty the moment Compare mode turns on.
  const [compareMetricKeys, setCompareMetricKeys] = useState<string[]>([
    "temperature",
  ]);
  function toggleCompareMetric(key: string) {
    setCompareMetricKeys((current) =>
      current.includes(key) ? current.filter((k) => k !== key) : [...current, key]
    );
  }
  const compareMetrics = COMPARISON_METRICS.filter((m) =>
    compareMetricKeys.includes(m.key)
  );

  // Widget order — now per-station, and reconciled against whatever
  // lib/stationWidgetConfig.ts says is enabled for the CURRENTLY selected
  // station, so switching stations shows that station's own widget set
  // instead of one fixed global list. Re-runs whenever selectedStationId
  // changes, not just on mount.
  const [order, setOrder] = useState<string[]>(DEFAULT_ENABLED_WIDGET_IDS);
  useEffect(() => {
    const enabledIds = loadStationWidgetIds(selectedStationId, DEFAULT_ENABLED_WIDGET_IDS);
    const savedOrder = loadWidgetOrder(widgetOrderStorageKey(selectedStationId), enabledIds);
    setOrder(reconcileWidgetOrder(savedOrder, enabledIds));
  }, [selectedStationId]);

  // Same reasoning as the widget order above — this is a real admin
  // setting now (app/(protected)/admin/page.tsx's Settings tab), not a
  // hardcoded constant.
  const [mapTheme, setMapTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    setMapTheme(loadAdminSettings().mapTheme);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrder((current) => {
      const oldIndex = current.indexOf(active.id as string);
      const newIndex = current.indexOf(over.id as string);
      const next = arrayMove(current, oldIndex, newIndex);
      saveWidgetOrder(widgetOrderStorageKey(selectedStationId), next);
      return next;
    });
  }

  function handleSaveStation(newStation: {
    name: string;
    particleDeviceId: string;
    latitude: number;
    longitude: number;
  }) {
    // TODO: POST to the real stations endpoint once it exists.
    const station: Station = {
      id: crypto.randomUUID(),
      status: "offline", // hasn't reported in yet
      lastSeenAt: null,
      ...newStation,
    };
    setStations((prev) => [...prev, station]);
    setSelectedStationId(station.id);
    setIsAddingStation(false);
    setPendingLocation(null);
  }

  // This is the actual "selecting a station displays that station's
  // details" wiring from FR-12.1: every widget below reads from `data`,
  // which is just whichever station is currently selected.
  const data = useMemo(
    () => MOCK_STATION_DATA[selectedStationId] ?? MOCK_STATION_DATA["1"],
    [selectedStationId]
  );
  const selectedStation = stations.find((s) => s.id === selectedStationId);

  // Derived data for the new demo widgets — see comments per widget below.
  const rawReadingsRows = data.hourLabels.map((time, i) => ({
    time,
    temp: data.tempHistory[i],
    humidity: data.humidityHistory[i],
    pressure: data.pressureHistory[i],
    rainfall: data.rainfallHistory[i],
  }));

  // Illustrative only — no wind sensor exists on the current hardware
  // (03-hardware-integration/hardware-team-clarification-request.md), so
  // this is a deterministic-but-fake pattern purely to show what
  // DirectionScatterChart looks like with real-shaped data.
  const windDirectionDemo = data.hourLabels.map((_, i) => (i * 47 + 30) % 360);

  const widgetContent: Record<string, React.ReactNode> = {
    "temperature-card": (
      <BigNumberCard
        label="Air Temperature"
        value={data.current.airTemp}
        unit="°C"
        accentColor="text-weather-warm"
        sparklineData={data.tempHistory}
        sparklineColor="#f59e0b"
        footer={[
          { label: "Today High", value: `${data.current.todayHigh}°` },
          { label: "Today Low", value: `${data.current.todayLow}°` },
        ]}
      />
    ),
    "humidity-card": (
      <BigNumberCard
        label="Humidity"
        value={data.current.humidity}
        unit="%"
        accentColor="text-weather-cold"
        sparklineData={data.humidityHistory}
        sparklineColor="#06b6d4"
      />
    ),
    "pressure-card": (
      <BigNumberCard
        label="Pressure"
        value={data.current.pressure}
        unit="hPa"
        accentColor="text-weather-accent"
        sparklineData={data.pressureHistory}
        sparklineColor="#3b82f6"
      />
    ),
    "rainfall-card": (
      <BigNumberCard
        label="Rainfall (rolling avg)"
        value={data.current.rollAvgRain_mm}
        unit="mm"
        accentColor="text-weather-rain"
        sparklineData={data.rainfallHistory}
        sparklineColor="#6366f1"
      />
    ),
    "rain-comparison-chart": (
      <RainfallComparisonChart
        categories={data.hourLabels}
        gauge1={data.rainGauge1}
        gauge2={data.rainGauge2}
        average={data.rainAverage}
      />
    ),
    "sensor-band-chart": (
      <SensorBandChart
        title="Air Temperature — Sensor Agreement (Air / BMP / SHT)"
        categories={data.hourLabels}
        min={data.sensorBand.min}
        max={data.sensorBand.max}
        average={data.sensorBand.average}
        unit="°C"
      />
    ),
    "trend-chart": (
      <TemperatureTrendChart
        title="Air Temperature — Full Day"
        data={data.fullDayTrend}
        color="#f59e0b"
        unit="°C"
      />
    ),
    "daily-summary-table": (
      <div>
        <h2 className="text-sm font-semibold text-gray-200 mb-2">
          Daily Summary
        </h2>
        <DailySummaryTable rows={data.dailyRows} unit="°" rainUnit="mm" />
      </div>
    ),

    // ---- Widgets added after the original core 8 — off by default per
    // lib/widgetCatalog.ts, an admin turns them on per station in
    // /admin's Widgets tab ----

    "station-summary-table": (
      <StationSummaryTable
        title="Period Summary"
        periodLabel={`${data.hourLabels[0]} – ${data.hourLabels[data.hourLabels.length - 1]}, Today`}
        data={data}
        metrics={COMPARISON_METRICS}
      />
    ),
    "raw-readings-table": (
      <RawReadingsTable
        title="Raw Readings"
        rows={rawReadingsRows}
        columns={[
          { key: "time", label: "Time", format: (r) => r.time },
          { key: "temp", label: "Temperature", align: "right", format: (r) => `${r.temp}°C` },
          { key: "humidity", label: "Humidity", align: "right", format: (r) => `${r.humidity}%` },
          { key: "pressure", label: "Pressure", align: "right", format: (r) => `${r.pressure} hPa` },
          { key: "rainfall", label: "Rainfall (avg)", align: "right", format: (r) => `${r.rainfall} mm` },
        ]}
      />
    ),
    "multi-sensor-line-chart": (
      <MultiSeriesLineChart
        title="Temperature Sensors — Individual Readings"
        categories={data.hourLabels}
        unit="°C"
        series={[
          { name: "Air", data: data.airTempHistory, color: "#f59e0b" },
          { name: "BMP", data: data.bmpTempHistory, color: "#06b6d4" },
          { name: "SHT", data: data.shtTempHistory, color: "#a78bfa" },
        ]}
      />
    ),
    "pressure-line-chart": (
      <SingleMetricChart
        title="Pressure — Line"
        categories={data.hourLabels}
        data={data.pressureHistory}
        unit="hPa"
        color="#3b82f6"
        variant="line"
      />
    ),
    "rainfall-area-chart": (
      <SingleMetricChart
        title="Rainfall — Area"
        categories={data.hourLabels}
        data={data.rainfallHistory}
        unit="mm"
        color="#6366f1"
        variant="area"
      />
    ),
    "wind-direction-scatter": (
      <DirectionScatterChart
        title="Wind Direction (illustrative — no sensor yet)"
        categories={data.hourLabels}
        degrees={windDirectionDemo}
      />
    ),
    "rain-accumulation-rate-chart": (
      <AccumulationRateChart
        title="Rainfall — Rate vs. Cumulative"
        categories={data.hourLabels}
        rate={data.rainGauge1}
        cumulative={data.rainfallHistory}
        unit="mm"
      />
    ),
  };

  // The four small cards sit side by side; everything else spans the row.
  const spanFor = (id: string) => (id.endsWith("-card") ? "xl:col-span-1" : "xl:col-span-4");

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Dashboard</h1>

        {/* FR-2.2, Administrator/Technical Team only — Station Operator
            never sees this button at all. */}
        {canCompare && (
          <button
            type="button"
            onClick={() => setCompareMode((v) => !v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              compareMode
                ? "bg-blue-600 shadow-lg shadow-blue-600/30"
                : "bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300"
            }`}
          >
            {compareMode ? "Exit Comparison" : "Compare Stations"}
          </button>
        )}
      </div>

      {compareMode ? (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <CompareStationsPanel
            stations={stations}
            selectedIds={compareStationIds}
            onToggle={toggleCompareStation}
          />
          <CompareMetricsPanel
            selectedKeys={compareMetricKeys}
            onToggle={toggleCompareMetric}
          />
        </div>
      ) : canSelectStation ? (
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 h-[420px]">
          <div className="flex flex-col gap-4 h-full min-h-0">
            <div className="flex-1 min-h-0">
              <StationList
                stations={stations}
                selectedStationId={selectedStationId}
                onSelectStation={setSelectedStationId}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                canManage={canManageStations}
                onAddStationClick={() => {
                  setIsAddingStation(true);
                  setPendingLocation(null);
                }}
              />
            </div>

            {isAddingStation && canManageStations && (
              <AddStationForm
                pendingLocation={pendingLocation}
                onCancel={() => {
                  setIsAddingStation(false);
                  setPendingLocation(null);
                }}
                onSave={handleSaveStation}
              />
            )}
          </div>

          <div className="h-full isolate">
            <StationMap
              stations={stations}
              selectedStationId={selectedStationId}
              onSelectStation={setSelectedStationId}
              onMapClick={
                isAddingStation && canManageStations
                  ? (lat, lng) => setPendingLocation({ lat, lng })
                  : undefined
              }
              pendingMarker={pendingLocation}
              mapTheme={mapTheme}
            />
          </div>
        </div>
      ) : (
        // Station Operator: no selector, just a label showing their one
        // fixed station — per FR-12.3, they have no access to this UI at all.
        <p className="text-sm text-gray-400 mb-4">
          Station:{" "}
          <span className="text-white font-medium">
            {selectedStation?.name ?? "Unknown"}
          </span>
        </p>
      )}

      {compareMode ? (
        compareStations.length === 0 ? (
          <div className="bg-weather-card rounded-2xl border border-white/10 p-8 text-center text-sm text-gray-500">
            Select at least one station above to compare.
          </div>
        ) : compareMetrics.length === 0 ? (
          <div className="bg-weather-card rounded-2xl border border-white/10 p-8 text-center text-sm text-gray-500">
            Select at least one metric above to compare.
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {compareMetrics.map((metric) => (
                <ComparisonChart
                  key={metric.key}
                  metric={metric}
                  stations={compareStations}
                />
              ))}
            </div>
            <ComparisonTable stations={compareStations} metrics={compareMetrics} />
          </>
        )
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={order} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {order.map((id) => {
                const content = widgetContent[id];
                if (!content) return null;
                return (
                  <SortableWidget key={id} id={id} className={spanFor(id)}>
                    {content}
                  </SortableWidget>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}