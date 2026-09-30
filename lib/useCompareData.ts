"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "./api";
import { mapReading, type ApiStationReading } from "./apiMappers";
import type { FetchStatus, StationReading } from "./types";

/** stationId -> readings, oldest first */
export type ReadingsByStation = Record<string, StationReading[]>;

interface CompareResponse {
  series: Record<string, ApiStationReading[]>;
}

async function fetchCompare(ids: string[], resolution: "hour" | "day", from: Date): Promise<ReadingsByStation> {
  const params = new URLSearchParams({
    ids: ids.join(","),
    resolution,
    from: from.toISOString(),
    to: new Date().toISOString(),
  });
  const res = await apiFetch<CompareResponse>(`/stations/compare?${params}`);
  const out: ReadingsByStation = {};
  for (const [id, rows] of Object.entries(res.series ?? {})) {
    out[id] = rows.map(mapReading);
  }
  return out;
}

/**
 * Compare screen's data source — GET /stations/compare (api-specification.md
 * §4). Always fetches the last 24h at hourly resolution (every secondary
 * chart and the analytics matrix run off it); when a multi-day hero range
 * is selected (heroDays), also fetches daily-resolution rows for the hero
 * temperature chart only.
 */
export function useCompareData(stationIds: string[], heroDays: number | null) {
  const [hourly, setHourly] = useState<ReadingsByStation>({});
  const [daily, setDaily] = useState<ReadingsByStation>({});
  const [status, setStatus] = useState<FetchStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  const idsKey = stationIds.join(",");

  useEffect(() => {
    if (stationIds.length === 0) {
      setHourly({});
      setDaily({});
      setStatus("ready");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setErrorMessage(null);
    const now = Date.now();
    Promise.all([
      fetchCompare(stationIds, "hour", new Date(now - 24 * 60 * 60 * 1000)),
      heroDays ? fetchCompare(stationIds, "day", new Date(now - heroDays * 24 * 60 * 60 * 1000)) : Promise.resolve({}),
    ])
      .then(([h, d]) => {
        if (cancelled) return;
        setHourly(h);
        setDaily(d);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMessage(err instanceof ApiError ? err.message : "Could not reach the telemetry API.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, heroDays, refetchToken]);

  return { hourly, daily, status, errorMessage, refetch: () => setRefetchToken((n) => n + 1) };
}