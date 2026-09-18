"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import StationInspectPod from "@/components/map/StationInspectPod";
import FleetInventoryTable from "@/components/map/FleetInventoryTable";
import ProvisionStationModal from "@/components/map/ProvisionStationModal";
import CalibrationDrawer from "@/components/map/CalibrationDrawer";
import { useStationContext } from "@/lib/StationContext";
import { CURRENT_ROLE, ROLE_LABELS } from "@/lib/mockAuth";
import { DEFAULT_CALIBRATION, type CalibrationOffsets } from "@/lib/calibration";
import { useAdminSettings } from "@/lib/AdminSettingsContext";
import { getStationHardware } from "@/lib/stationHardware";
import type { Station } from "@/lib/types";

const StationMap = dynamic(() => import("@/components/map/StationMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center text-slate-500 text-sm bg-card-bg rounded-2xl border border-border-line">
      Loading map…
    </div>
  ),
});

/**
 * Station Management Map — FR-12, rebuilt to match the
 * station_management_map_hardware_provisioning_redesigned Stitch screen.
 *
 * Visibility/permissions (CONFIRMED, stakeholder-analysis.md):
 * - Technical Team: full access — provision/calibrate/ping stations.
 * - Administrator: read-only — select, search, view fleet analytics.
 * - Station Operator: no access to this page (enforced at the header nav
 *   level in lib/headerNav.ts; the backend is the real security boundary).
 *
 * The redesign swaps the real Leaflet/OSM map for a decorative illustrated
 * "tactical map" — per your call, this keeps the real Leaflet map instead
 * and restyles it to match (see StationMap.tsx's mapTheme/terrainMode).
 * The old sidebar station list + inline add-station form are gone, replaced
 * by the search bar, the map's own markers + inspect pod, and the Fleet
 * Inventory table below — matching the redesign's layout, which drops the
 * sidebar entirely.
 */
export default function StationsPage() {
  const { stations, setStations, selectedStationId, setSelectedStationId } = useStationContext();

  const canManage = CURRENT_ROLE === "technical_team";

  const [searchQuery, setSearchQuery] = useState("");
  const { settings } = useAdminSettings();
  const [layer, setLayer] = useState<"dark" | "light" | "terrain">("dark");
  // The basemap default is a real Admin setting (System & Map Preferences
  // tab), shared live via AdminSettingsContext — so changing it there
  // updates this screen immediately, with no reload or renavigation
  // needed. Skips re-syncing while "terrain" is active so switching to
  // Elevation Terrain here isn't silently undone by an unrelated settings
  // change elsewhere.
  useEffect(() => {
    setLayer((current) => (current === "terrain" ? current : settings.mapTheme));
  }, [settings.mapTheme]);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isPlacingStation, setIsPlacingStation] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [calibratingStation, setCalibratingStation] = useState<Station | null>(null);
  const [calibrationOverrides, setCalibrationOverrides] = useState<
    Record<string, CalibrationOffsets>
  >({});
  const [recenterSignal, setRecenterSignal] = useState(0);

  const selectedStation = stations.find((s) => s.id === selectedStationId) ?? null;

  const filteredStations = useMemo(() => {
    if (!searchQuery.trim()) return stations;
    const q = searchQuery.trim().toLowerCase();
    return stations.filter((s) => {
      const hw = getStationHardware(s.id);
      return s.name.toLowerCase().includes(q) || hw.geolocationLabel.toLowerCase().includes(q);
    });
  }, [stations, searchQuery]);

  const onlineCount = stations.filter((s) => s.status === "online").length;
  const centroid =
    stations.length > 0
      ? {
          lat: stations.reduce((sum, s) => sum + s.latitude, 0) / stations.length,
          lng: stations.reduce((sum, s) => sum + s.longitude, 0) / stations.length,
        }
      : { lat: -15.7861, lng: 35.0058 };

  function handleMapClickForPlacement(lat: number, lng: number) {
    setPendingCoords({ lat, lng });
    setIsPlacingStation(false);
    setIsProvisioning(true);
  }

  function handleRepickLocation() {
    setIsProvisioning(false);
    setIsPlacingStation(true);
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
    setIsProvisioning(false);
    setPendingCoords(null);
  }

  function handleCalibrateSave(stationId: string, offsets: CalibrationOffsets) {
    setCalibrationOverrides((prev) => ({ ...prev, [stationId]: offsets }));
  }

  function handleSyncFleet() {
    // Simulates a fresh fleet sync pass — real implementation would refetch
    // from the backend instead of just bumping local timestamps.
    setStations((prev) =>
      prev.map((s) => (s.status === "online" ? { ...s, lastSeenAt: new Date().toISOString() } : s))
    );
  }

  function handleExportCsv() {
    const header = [
      "Station",
      "Latitude",
      "Longitude",
      "Particle Device ID",
      "Firmware",
      "Status",
      "Last Seen",
      "Baro Offset (hPa)",
      "Temp Offset (C)",
    ];
    const rows = stations.map((s) => {
      const hw = getStationHardware(s.id);
      const calib = calibrationOverrides[s.id] ?? DEFAULT_CALIBRATION;
      return [
        s.name,
        s.latitude,
        s.longitude,
        s.particleDeviceId,
        hw.firmware,
        s.status,
        s.lastSeenAt ?? "",
        calib.baroOffsetHpa,
        calib.tempOffsetC,
      ];
    });
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "station-fleet-inventory.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* HUD strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-card-bg border border-border-line font-mono text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="material-symbols-outlined text-[16px] text-primary-container">hub</span>
            GEO-GRID SECTOR: <strong className="text-white">SOUTHERN MALAWI</strong>
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="material-symbols-outlined text-[16px]">my_location</span>
            REF: {Math.abs(centroid.lat).toFixed(4)}°S, {centroid.lng.toFixed(4)}°E
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            AWS MESH: {onlineCount} NODE{onlineCount === 1 ? "" : "S"} ACTIVE
          </span>
        </div>
        <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-secondary font-semibold">
          ROLE: {ROLE_LABELS[CURRENT_ROLE]} ({canManage ? "Full Write" : "Read Only"})
        </span>
      </div>

      {/* Search + layer switcher + provision */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[220px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-500">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search location, district, station..."
            className="w-full bg-card-bg border border-border-line rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        <div className="flex items-center bg-card-bg border border-border-line rounded-xl p-1 font-mono text-xs">
          <button
            type="button"
            onClick={() => setLayer("dark")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              layer === "dark" ? "bg-cyan-500/20 text-primary-container font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">dark_mode</span>
            Dark Tactical
          </button>
          <button
            type="button"
            onClick={() => setLayer("terrain")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              layer === "terrain" ? "bg-cyan-500/20 text-primary-container font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">terrain</span>
            Elevation Terrain
          </button>
          <button
            type="button"
            disabled
            title="Needs a connected weather-radar data provider — not wired up yet"
            className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-slate-600 cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[15px]">radar</span>
            Rain Radar
          </button>
          <button
            type="button"
            disabled
            title="Needs a connected wind-vector data provider — not wired up yet"
            className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-slate-600 cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[15px]">air</span>
            Wind Vectors
          </button>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => {
              setPendingCoords(null);
              setIsPlacingStation(true);
            }}
            disabled={isPlacingStation}
            className="px-4 py-2.5 rounded-xl bg-primary-container hover:bg-primary text-slate-950 font-bold text-sm flex items-center gap-1.5 transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            {isPlacingStation ? "Click the map to place it…" : "Provision New AWS Station"}
          </button>
        )}
      </div>

      {/* Map */}
      {/* `isolate` is the fix for the map covering the header: Leaflet's
          own CSS gives its internal panes/controls z-index up to 1000,
          and without a stacking context of its own here, those z-indices
          compared directly against the header's z-50 and won. `isolate`
          contains all of Leaflet's internal stacking inside this div, so
          nothing it does can escape above page chrome outside this box. */}
      <div className="relative isolate h-[560px] rounded-2xl overflow-hidden border border-border-line bg-card-bg">
        {isPlacingStation && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3 bg-card-bg/95 backdrop-blur-md border border-cyan-500/40 rounded-xl px-4 py-2.5 shadow-2xl">
            <span className="material-symbols-outlined text-[18px] text-primary-container animate-pulse">
              pin_drop
            </span>
            <span className="text-sm text-white font-medium">Click the map to place the new station</span>
            <button
              type="button"
              onClick={() => setIsPlacingStation(false)}
              className="ml-2 px-2.5 py-1 rounded-lg bg-card-bg-subtle hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
        <StationMap
          stations={filteredStations}
          selectedStationId={selectedStationId}
          onSelectStation={setSelectedStationId}
          onMapClick={isPlacingStation ? handleMapClickForPlacement : undefined}
          pendingMarker={pendingCoords}
          mapTheme={layer === "dark" ? "dark" : "light"}
          terrainMode={layer === "terrain"}
          showControls
          showPopups={false}
          recenterSignal={recenterSignal}
          onRecenterClick={() => setRecenterSignal((n) => n + 1)}
        />
        {selectedStation && !isPlacingStation && (
          <StationInspectPod station={selectedStation} onCalibrate={setCalibratingStation} />
        )}
      </div>

      {/* Fleet inventory */}
      <FleetInventoryTable
        stations={filteredStations}
        calibrationOverrides={calibrationOverrides}
        canManage={canManage}
        onCalibrate={setCalibratingStation}
        onExportCsv={handleExportCsv}
        onSyncFleet={handleSyncFleet}
      />

      {isProvisioning && (
        <ProvisionStationModal
          initialLatitude={pendingCoords?.lat}
          initialLongitude={pendingCoords?.lng}
          onRepickLocation={handleRepickLocation}
          onSave={handleSaveStation}
          onClose={() => {
            setIsProvisioning(false);
            setPendingCoords(null);
          }}
        />
      )}

      {calibratingStation && (
        <CalibrationDrawer
          station={calibratingStation}
          current={calibrationOverrides[calibratingStation.id] ?? DEFAULT_CALIBRATION}
          onSave={handleCalibrateSave}
          onClose={() => setCalibratingStation(null)}
        />
      )}
    </div>
  );
}