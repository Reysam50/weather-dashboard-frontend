"use client";

import { useMemo, useState } from "react";
import { useStationContext } from "@/lib/StationContext";
import { useHydrated } from "@/lib/useHydrated";
import { MOCK_STATION_DATA } from "@/lib/mockStationData";
import { getStationHardware } from "@/lib/stationHardware";
import {
  assignStationColors,
  buildFindings,
  buildMatrixRows,
  buildDailyAggregate,
} from "@/lib/compareData";
import StationSummaryCards from "@/components/compare/StationSummaryCards";
import FindingsRibbon from "@/components/compare/FindingsRibbon";
import MultiStationTrendChart from "@/components/compare/MultiStationTrendChart";
import ComparisonMatrixTable from "@/components/compare/ComparisonMatrixTable";
import AddStationModal, { MAX_COMPARE_STATIONS } from "@/components/compare/AddStationModal";

type RangeTab = "today" | "7d" | "30d" | "custom";

/**
 * Station Compare — rebuilt to match
 * multi_station_comparison_correlation_redesigned. This screen didn't
 * exist as a real route before (the old dashboard had an inline "Compare
 * Stations" toggle mode, removed when the Live Telemetry screen became
 * the fixed redesign layout) — components/dashboard/CompareStationsPanel,
 * CompareMetricsPanel, ComparisonChart, and ComparisonTable were all
 * orphaned by that change and aren't reused here (this screen's charts
 * use the same custom-SVG approach as the Live Telemetry screen instead
 * of their react-apexcharts one, for visual consistency across screens
 * now that both exist). Those 4 files — and the entire components/widgets/
 * folder from the old drag-and-drop widget catalog era, except two type
 * exports lib/mockStationData.ts still imports — are confirmed unused
 * anywhere in the app; flagging in case you want them cleaned up in a
 * separate pass.
 *
 * The "Today 24h" tab uses real per-station hourly mock data throughout.
 * "Past 7 Days"/"Past 30 Days"/"Custom" only re-scope the hero
 * temperature chart to a synthetic daily aggregate (lib/compareData.ts's
 * buildDailyAggregate) — the secondary charts and analytics matrix stay
 * on "Today" hourly detail in every tab, labeled as such, rather than
 * pretending humidity/pressure/rain/solar have a real multi-day history
 * they don't.
 */
export default function ComparePage() {
  const { stations } = useStationContext();

  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    stations.slice(0, MAX_COMPARE_STATIONS).map((s) => s.id)
  );
  const [rangeTab, setRangeTab] = useState<RangeTab>("today");
  const [customDays, setCustomDays] = useState(14);
  const [isAdding, setIsAdding] = useState(false);

  const selectedStations = stations.filter((s) => selectedIds.includes(s.id));
  const colors = useMemo(() => assignStationColors(selectedStations), [selectedStations]);
  const hydrated = useHydrated();
  // buildFindings computes offline-duration text from Date.now(), which
  // would otherwise mismatch between server render and client hydration
  // (see lib/useHydrated.ts) — hold off until mounted.
  const findings = useMemo(() => (hydrated ? buildFindings(selectedStations) : []), [selectedStations, hydrated]);
  const matrixRows = useMemo(() => buildMatrixRows(selectedStations), [selectedStations]);

  const onlineStations = selectedStations.filter((s) => s.status === "online");
  const offlineStations = selectedStations.filter((s) => s.status === "offline");
  const primary = onlineStations[0];

  const hourLabels = primary ? MOCK_STATION_DATA[primary.id]?.hourLabels ?? [] : [];

  const heroDays = rangeTab === "7d" ? 7 : rangeTab === "30d" ? 30 : rangeTab === "custom" ? customDays : null;

  const heroSeries = useMemo(() => {
    if (heroDays) {
      return selectedStations.map((s) => ({
        station: s,
        color: colors[s.id],
        values: buildDailyAggregate(s.id, heroDays).avg,
      }));
    }
    return selectedStations.map((s) => {
      const data = MOCK_STATION_DATA[s.id];
      return { station: s, color: colors[s.id], values: data?.tempHistory ?? [] };
    });
  }, [selectedStations, colors, heroDays]);

  const heroLabels = heroDays ? buildDailyAggregate(selectedStations[0]?.id ?? "1", heroDays).labels : hourLabels;

  const humiditySeries = onlineStations.slice(0, 2).map((s) => ({
    station: s,
    color: colors[s.id],
    values: MOCK_STATION_DATA[s.id]?.humidityHistory ?? [],
  }));
  const pressureSeries = onlineStations.slice(0, 2).map((s) => ({
    station: s,
    color: colors[s.id],
    values: MOCK_STATION_DATA[s.id]?.pressureHistory ?? [],
  }));

  function avgOf(values: number[]) {
    return values.length ? values.reduce((a, v) => a + v, 0) / values.length : 0;
  }

  const humidityDelta =
    humiditySeries.length === 2
      ? Number((avgOf(humiditySeries[0].values) - avgOf(humiditySeries[1].values)).toFixed(1))
      : 0;
  const pressureDelta =
    pressureSeries.length === 2
      ? Number((avgOf(pressureSeries[0].values) - avgOf(pressureSeries[1].values)).toFixed(1))
      : 0;

  function toggleStation(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : prev.length < MAX_COMPARE_STATIONS ? [...prev, id] : prev
    );
  }

  function handleExportHeroCsv() {
    const header = ["Label", ...selectedStations.map((s) => s.name)];
    const rows = heroLabels.map((label, i) => [label, ...heroSeries.map((s) => String(s.values[i] ?? ""))]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    downloadCsv(csv, "station-comparison-temperature.csv");
  }

  function handleExportMatrixCsv() {
    const header = [
      "Parameter",
      ...onlineStations.flatMap((s) => [`${s.name} High`, `${s.name} Low`, `${s.name} Avg`]),
      ...offlineStations.map((s) => `${s.name} (est)`),
      "Delta",
    ];
    const rows = matrixRows.map((row) => [
      `${row.label} (${row.unit})`,
      ...onlineStations.flatMap((s) => {
        const stat = row.perOnlineStation[s.id];
        return [String(stat?.high ?? ""), String(stat?.low ?? ""), String(stat?.avg ?? "")];
      }),
      ...offlineStations.map((s) => String(row.perOfflineStation[s.id] ?? "")),
      row.delta ? `${row.delta.text} ${row.delta.tag}` : "",
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    downloadCsv(csv, "station-comparison-matrix.csv");
  }

  return (
    <div className="space-y-6">
      {/* Comparison grid HUD strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 rounded-2xl bg-card-bg border border-border-line font-mono text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 text-primary-container font-semibold">
            <span className="material-symbols-outlined text-[16px]">grid_view</span>
            STATION COMPARISON GRID
          </span>
          {primary && (
            <span className="text-on-surface-variant">
              PRIMARY NODE: <strong className="text-white">{primary.name}</strong> ({primary.latitude.toFixed(3)}°,{" "}
              {primary.longitude.toFixed(3)}°)
            </span>
          )}
          {primary && (
            <span className="text-on-surface-variant">
              GATEWAY: <strong className="text-white">{getStationHardware(primary.id).gatewayLabel}</strong>
            </span>
          )}
        </div>
        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {onlineStations.length}/{selectedStations.length} LIVE TRANSMIT: SYNC OK
        </span>
      </div>

      {/* Title + control ribbon */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider">
            Regional Operations / Malawi Southern AWS Grid / Synchronized Analysis
          </p>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">Multi-Station Synchronized Analysis</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-primary-container/15 border border-primary-container/30 text-primary-container font-mono text-[11px] font-bold">
              {selectedStations.length > 1 ? "DUAL SYNCHRONOUS INGEST" : "SINGLE NODE"}
            </span>
          </div>
          <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
            Real-time microclimate delta tracking, topographic variance, and anomaly correlation across the
            selected Automatic Weather Station (AWS) network.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-card-bg border border-border-line rounded-xl p-1 font-mono text-xs">
            {(
              [
                ["today", "Today 24h"],
                ["7d", "Past 7 Days"],
                ["30d", "Past 30 Days"],
                ["custom", "Custom"],
              ] as [RangeTab, string][]
            ).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setRangeTab(tab)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  rangeTab === tab ? "bg-cyan-500/20 text-primary-container font-semibold" : "text-slate-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {rangeTab === "custom" && (
            <div className="flex items-center gap-1.5 bg-card-bg border border-border-line rounded-xl px-2.5 py-1.5 font-mono text-xs text-slate-300">
              <span>Last</span>
              <input
                type="number"
                min={2}
                max={90}
                value={customDays}
                onChange={(e) => setCustomDays(Math.min(90, Math.max(2, Number(e.target.value) || 2)))}
                className="w-12 bg-transparent text-center focus:outline-none text-primary-container font-bold"
              />
              <span>days</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleExportHeroCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card-bg-subtle hover:bg-slate-700 text-white font-mono text-xs transition-colors border border-border-line"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            Export CSV
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsAdding(true)}
        disabled={selectedIds.length >= MAX_COMPARE_STATIONS}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-container hover:bg-primary text-slate-950 font-bold text-sm shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined text-[18px]">add_circle</span>
        + Add Station
      </button>

      <StationSummaryCards stations={selectedStations} colors={colors} onRemove={toggleStation} />

      <FindingsRibbon findings={findings} />

      {selectedStations.length === 0 ? (
        <div className="bg-card-bg rounded-2xl border border-border-line p-10 text-center text-on-surface-variant">
          No stations selected — add one above to start comparing.
        </div>
      ) : (
        <>
          <MultiStationTrendChart
            title={`Air Temperature (°C) — Multi-Station Trend${heroDays ? ` (${heroDays}d)` : ""}`}
            subtitle={
              heroDays
                ? `Synthetic daily aggregate // last ${heroDays} days`
                : `Continuous synchronized rolling telemetry // ${hourLabels[0] ?? ""} to ${hourLabels[hourLabels.length - 1] ?? ""} CAT (1-hr resolution)`
            }
            series={heroSeries}
            unit="°C"
            hourLabels={heroLabels}
            showArea
            showPeakAnnotation={!heroDays}
          />

          {!heroDays && humiditySeries.length > 0 && pressureSeries.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MultiStationTrendChart
                title="Relative Humidity (%) — Comparison"
                subtitle="Valley basin moisture trap vs mountain windward condensation"
                series={humiditySeries}
                unit="%"
                hourLabels={hourLabels}
                height={200}
                deltaBadge={
                  humiditySeries.length === 2
                    ? { text: `Δ ${humidityDelta >= 0 ? "+" : ""}${humidityDelta}% Offset`, colorClass: "text-secondary" }
                    : undefined
                }
              />
              <MultiStationTrendChart
                title="Pressure — Station Comparison (QNH hPa)"
                subtitle="Sea-level adjusted synoptic front progression"
                series={pressureSeries}
                unit=" hPa"
                hourLabels={hourLabels}
                height={200}
                deltaBadge={
                  pressureSeries.length === 2
                    ? { text: `Δ ${pressureDelta >= 0 ? "+" : ""}${pressureDelta} hPa Differential`, colorClass: "text-primary-container" }
                    : undefined
                }
              />
            </div>
          )}

          <ComparisonMatrixTable
            stations={selectedStations}
            colors={colors}
            rows={matrixRows}
            rangeLabel="Today"
            onExportXls={handleExportMatrixCsv}
          />
        </>
      )}

      {isAdding && (
        <AddStationModal
          allStations={stations}
          selectedIds={selectedIds}
          onToggle={toggleStation}
          onClose={() => setIsAdding(false)}
        />
      )}
    </div>
  );
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}