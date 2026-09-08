"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import StationList from "@/components/map/StationList";
import AddStationForm from "@/components/map/AddStationForm";
import type { Station } from "@/lib/types";

const StationMap = dynamic(() => import("@/components/map/StationMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center text-gray-500 text-sm bg-weather-card rounded-2xl border border-white/10">
      Loading map…
    </div>
  ),
});

/**
 * Station Management Map UI — FR-12.
 *
 * Visibility/permissions (CONFIRMED, stakeholder-analysis.md):
 * - Technical Team: full access — add, remove, edit stations/equipment, plus
 *   everything Administrator can do (select, search, compare)
 * - Administrator: read-only — select, search, compare. No write controls render.
 * - Station Operator: no access to this page at all.
 *
 * This is also the station-provisioning mechanism (integration-boundary.md §5) —
 * pairing a physical station's Particle device ID with a station record happens
 * here, Technical Team only.
 *
 * TODO (frontend developer):
 * - replace CURRENT_ROLE with the real value from GET /auth/me, and actually
 *   redirect Station Operators away from this route entirely (not just hide
 *   the write controls — the UI check below is a UX nicety, not security;
 *   the backend enforces the real boundary)
 * - replace mockStations with a real fetch, and handleSaveStation's local
 *   state update with a POST to the real stations endpoint
 */

const CURRENT_ROLE: "technical_team" | "administrator" = "technical_team";

const mockStations: Station[] = [
  {
    id: "1",
    name: "Chancellor College",
    latitude: -15.386,
    longitude: 35.3182,
    particleDeviceId: "3a0021000747343232363230",
    status: "online",
    lastSeenAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Zomba Plateau",
    latitude: -15.3833,
    longitude: 35.35,
    particleDeviceId: "2b0031000847232131353120",
    status: "online",
    lastSeenAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Blantyre CBD",
    latitude: -15.7861,
    longitude: 35.0058,
    particleDeviceId: "1c0041000947121030242020",
    status: "offline",
    lastSeenAt: "2026-09-04T08:15:00Z",
  },
];

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>(mockStations);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(
    mockStations[0]?.id ?? null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingStation, setIsAddingStation] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const canManage = CURRENT_ROLE === "technical_team";

  function handleAddStationClick() {
    setIsAddingStation(true);
    setPendingLocation(null);
  }

  function handleCancelAdd() {
    setIsAddingStation(false);
    setPendingLocation(null);
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

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Station Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 h-[70vh] min-h-[500px]">
        <div className="flex flex-col gap-4 h-full min-h-0">
          <div className="flex-1 min-h-0">
            <StationList
              stations={stations}
              selectedStationId={selectedStationId}
              onSelectStation={setSelectedStationId}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              canManage={canManage}
              onAddStationClick={handleAddStationClick}
            />
          </div>

          {isAddingStation && canManage && (
            <AddStationForm
              pendingLocation={pendingLocation}
              onCancel={handleCancelAdd}
              onSave={handleSaveStation}
            />
          )}
        </div>

        <div className="h-full">
          <StationMap
            stations={stations}
            selectedStationId={selectedStationId}
            onSelectStation={setSelectedStationId}
            onMapClick={
              isAddingStation && canManage
                ? (lat, lng) => setPendingLocation({ lat, lng })
                : undefined
            }
            pendingMarker={pendingLocation}
          />
        </div>
      </div>
    </div>
  );
}