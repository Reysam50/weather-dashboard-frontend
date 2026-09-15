"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { Station } from "./types";
import { mockStations } from "./mockStations";
import { CURRENT_ROLE, ASSIGNED_STATION_ID } from "./mockAuth";

/**
 * The redesign puts the station picker in the header (AppHeader.tsx) instead
 * of on the dashboard page itself, so which station is "selected" now has to
 * be state shared across the whole protected shell — every page under
 * app/(protected) needs to read (and some, like Admin, may eventually write)
 * the same value the header dropdown shows.
 *
 * Station Operators don't get a picker at all (per stakeholder-analysis.md's
 * permission table, they only ever see their own assigned station) — this
 * provider bakes that in by ignoring setSelectedStationId when the role
 * doesn't allow picking, same restriction the old dashboard-local state used
 * to enforce.
 */
interface StationContextValue {
  stations: Station[];
  setStations: React.Dispatch<React.SetStateAction<Station[]>>;
  selectedStationId: string;
  setSelectedStationId: (id: string) => void;
  selectedStation: Station | undefined;
  canSelectStation: boolean;
}

const StationContext = createContext<StationContextValue | null>(null);

export function StationProvider({ children }: { children: React.ReactNode }) {
  const canSelectStation = CURRENT_ROLE !== "station_operator";

  const [stations, setStations] = useState<Station[]>(mockStations);
  const [selectedStationId, setSelectedStationIdState] = useState<string>(
    canSelectStation ? mockStations[0]?.id ?? "1" : ASSIGNED_STATION_ID
  );

  function setSelectedStationId(id: string) {
    if (!canSelectStation) return;
    setSelectedStationIdState(id);
  }

  const selectedStation = stations.find((s) => s.id === selectedStationId);

  const value = useMemo(
    () => ({
      stations,
      setStations,
      selectedStationId,
      setSelectedStationId,
      selectedStation,
      canSelectStation,
    }),
    [stations, selectedStationId, selectedStation, canSelectStation]
  );

  return <StationContext.Provider value={value}>{children}</StationContext.Provider>;
}

export function useStationContext() {
  const ctx = useContext(StationContext);
  if (!ctx) {
    throw new Error("useStationContext must be used within a StationProvider");
  }
  return ctx;
}
