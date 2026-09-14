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
import GaugeChart from "@/components/widgets/GaugeChart";
import PieChartWidget from "@/components/widgets/PieChartWidget";
import BarChartWidget from "@/components/widgets/BarChartWidget";
import ThresholdRangeChart, { type ThresholdBand } from "@/components/widgets/ThresholdRangeChart";
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

const StationMap = dynamic(() => import("@/components/map/StationMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center text-gray-500 text-sm bg-weather-card rounded-2xl border border-white/10">
      Loading map…
    </div>
  ),
});

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

  const [searchMarker, setSearchMarker] = useState<{
    lat: number;
    lng: number;
    label: string;
  } | null>(null);

  function handleLocationFound(lat: number, lng: number, label: string) {
    if (isAddingStation && canManageStations) {
      setPendingLocation({ lat, lng });
    } else {
      setSearchMarker({ lat, lng, label });
    }
  }

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

  const [order, setOrder] = useState<string[]>(DEFAULT_ENABLED_WIDGET_IDS);
  useEffect(() => {
    const enabledIds = loadStationWidgetIds(selectedStationId, DEFAULT_ENABLED_WIDGET_IDS);
    const savedOrder = loadWidgetOrder(widgetOrderStorageKey(selectedStationId), enabledIds);
    setOrder(reconcileWidgetOrder(savedOrder, enabledIds));
  }, [selectedStationId]);

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
    const station: Station = {
      id: crypto.randomUUID(),
      status: "offline",
      lastSeenAt: null,
      ...newStation,
    };
    setStations((prev) => [...prev, station]);
    setSelectedStationId(station.id);
    setIsAddingStation(false);
    setPendingLocation(null);
  }

  const data = useMemo(
    () => MOCK_STATION_DATA[selectedStationId] ?? MOCK_STATION_DATA["1"],
    [selectedStationId]
  );
  const selectedStation = stations.find((s) => s.id === selectedStationId);

  const rawReadingsRows = data.hourLabels.map((time, i) => ({
    time,
    temp: data.tempHistory[i],
    humidity: data.humidityHistory[i],
    pressure: data.pressureHistory[i],
    rainfall: data.rainfallHistory[i],
  }));

  const windDirectionDemo = data.hourLabels.map((_, i) => (i * 47 + 30) % 360);

  const sensorReadingSeries = [
    { name: "Air", value: data.current.airTemp, color: "#f59e0b" },
    {
      name: "BMP",
      value: data.bmpTempHistory[data.bmpTempHistory.length - 1],
      color: "#06b6d4",
    },
    {
      name: "SHT",
      value: data.shtTempHistory[data.shtTempHistory.length - 1],
      color: "#a78bfa",
    },
  ];

  const temperatureBands: ThresholdBand[] = [
    { label: "<15°C — Cold", from: -10, to: 15, color: "#3b82f6" },
    { label: "15–25°C — Mild", from: 15, to: 25, color: "#22c55e" },
    { label: "25–32°C — Warm", from: 25, to: 32, color: "#f59e0b" },
    { label: ">32°C — Hot", from: 32, to: 45, color: "#ef4444" },
  ];

  const widgetContent: Record<string, React.ReactNode> = {
    "temperature-card": (
      <BigNumberCard
        label="Air Temperature"
        value={data.current.airTemp}
        unit="°C"
        accentColor="text-weather-warm"
        sparklineData={data.tempHistory}
        sparklineColor="#f59e0b"
        lastUpdated={data.current.lastUpdatedAt}
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
        lastUpdated={data.current.lastUpdatedAt}
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
        lastUpdated={data.current.lastUpdatedAt}
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
        lastUpdated={data.current.lastUpdatedAt}
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
        pageSize={5}
        columns={[
          { key: "time", label: "Time", format: (r) => r.time },
          { key: "temp", label: "Temperature", align: "right", format: (r) => `${r.temp}°C`, sortValue: (r) => r.temp },
          { key: "humidity", label: "Humidity", align: "right", format: (r) => `${r.humidity}%`, sortValue: (r) => r.humidity },
          { key: "pressure", label: "Pressure", align: "right", format: (r) => `${r.pressure} hPa`, sortValue: (r) => r.pressure },
          { key: "rainfall", label: "Rainfall (avg)", align: "right", format: (r) => `${r.rainfall} mm`, sortValue: (r) => r.rainfall },
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
    "temperature-gauge": (
      <GaugeChart
        title="Air Temperature"
        value={data.current.airTemp}
        min={0}
        max={45}
        unit="°C"
        color="#f59e0b"
      />
    ),
    "humidity-gauge": (
      <GaugeChart
        title="Humidity"
        value={data.current.humidity}
        min={0}
        max={100}
        unit="%"
        color="#06b6d4"
      />
    ),
    "sensor-pie-chart": (
      <PieChartWidget
        title="Temperature Sensors — Share"
        series={sensorReadingSeries}
        unit="°C"
      />
    ),
    "sensor-bar-chart": (
      <BarChartWidget
        title="Temperature Sensors — Compare"
        series={sensorReadingSeries}
        unit="°C"
      />
    ),
    "temperature-threshold-bands": (
      <ThresholdRangeChart
        title="Air Temperature — Threshold Bands"
        categories={data.hourLabels}
        data={data.tempHistory}
        bands={temperatureBands}
        unit="°C"
      />
    ),
  };

  const spanFor = (id: string) => (id.endsWith("-card") ? "xl:col-span-1" : "xl:col-span-4");

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Dashboard</h1>

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
                  setSearchMarker(null);
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
              onLocationFound={handleLocationFound}
              searchMarker={searchMarker}
            />
          </div>
        </div>
      ) : (
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