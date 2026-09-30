"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { FetchStatus, Station } from "./types";
import { apiFetch, ApiError } from "./api";
import { mapStation } from "./apiMappers";
import { useAuth } from "./AuthContext";

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
 *
 * `stations` is fetched from GET /stations (api-specification.md §4) here,
 * once, for the whole app — every screen that needs the station list reads
 * it from this context rather than fetching its own copy. An Operator's
 * request is scoped server-side to their assigned station(s) automatically,
 * so no client-side filtering happens on top of that.
 */
interface StationContextValue {
  stations: Station[];
  setStations: React.Dispatch<React.SetStateAction<Station[]>>;
  status: FetchStatus;
  error: string | null;
  refetch: () => void;
  selectedStationId: string;
  setSelectedStationId: (id: string) => void;
  selectedStation: Station | undefined;
  canSelectStation: boolean;
}

const StationContext = createContext<StationContextValue | null>(null);

export function StationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const canSelectStation = user.role !== "station_operator";
  const assignedStationId = user.stations !== "all" && user.stations.length > 0 ? user.stations[0] : "";

  const [stations, setStations] = useState<Station[]>([]);
  const [status, setStatus] = useState<FetchStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [selectedStationId, setSelectedStationIdState] = useState<string>(assignedStationId);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    apiFetch<Parameters<typeof mapStation>[0][]>("/stations")
      .then((raw) => {
        if (cancelled) return;
        const mapped = raw.map(mapStation);
        setStations(mapped);
        setStatus(mapped.length === 0 ? "offline" : "ready");
        // Only auto-pick the first station for roles that can pick at all —
        // an Operator's selection is fixed to their assignment above.
        setSelectedStationIdState((current) => current || (canSelectStation ? mapped[0]?.id ?? "" : assignedStationId));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Could not reach the station API.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchToken]);

  function setSelectedStationId(id: string) {
    if (!canSelectStation) return;
    setSelectedStationIdState(id);
  }

  const selectedStation = stations.find((s) => s.id === selectedStationId);

  const value = useMemo(
    () => ({
      stations,
      setStations,
      status,
      error,
      refetch: () => setRefetchToken((n) => n + 1),
      selectedStationId,
      setSelectedStationId,
      selectedStation,
      canSelectStation,
    }),
    [stations, status, error, selectedStationId, selectedStation, canSelectStation]
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