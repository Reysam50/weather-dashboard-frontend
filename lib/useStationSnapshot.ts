"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "./api";
import { mapReading, type ApiStationReading } from "./apiMappers";
import type { StationReading } from "./types";

/**
 * Lightweight "what is this station reporting right now" lookup for the
 * map's inspect pod: the latest reading plus the last 12 hours of hourly
 * readings for its sparkline. Any failure (including a station that has
 * never reported) just yields an empty snapshot — the pod then shows its
 * own "no telemetry" state rather than a page-level error.
 */
export function useStationSnapshot(stationId: string) {
  const [latest, setLatest] = useState<StationReading | null>(null);
  const [recent, setRecent] = useState<StationReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const from = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const params = new URLSearchParams({ resolution: "hour", from, to: new Date().toISOString() });
    Promise.all([
      apiFetch<ApiStationReading>(`/telemetry/${stationId}/latest`),
      apiFetch<{ readings: ApiStationReading[] }>(`/telemetry/${stationId}?${params}`),
    ])
      .then(([l, h]) => {
        if (cancelled) return;
        setLatest(mapReading(l));
        setRecent(h.readings.map(mapReading));
      })
      .catch(() => {
        if (cancelled) return;
        setLatest(null);
        setRecent([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [stationId]);

  return { latest, recent, loading };
}