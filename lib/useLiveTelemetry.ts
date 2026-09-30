"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch, ApiError } from "./api";
import { mapReading } from "./apiMappers";
import { dashboardSocket, type ReadingMessage, type SocketConnectionState, type StatusMessage } from "./websocket";
import { deriveLiveExtras, deriveStationView, type StationView } from "./deriveStationView";
import type { LiveTelemetryExtras } from "./liveTelemetryData";
import type { FetchStatus, StationReading } from "./types";

const MINUTE_WINDOW = 60;
const HOURLY_WINDOW_HOURS = 24;
const DAILY_WINDOW_DAYS = 7;

interface RawTelemetryResponse {
  station_id: string;
  resolution: string;
  readings: Parameters<typeof mapReading>[0][];
}

async function fetchResolution(stationId: string, resolution: "minute" | "hour" | "day", from: Date): Promise<StationReading[]> {
  const params = new URLSearchParams({ resolution, from: from.toISOString(), to: new Date().toISOString() });
  const res = await apiFetch<RawTelemetryResponse>(`/telemetry/${stationId}?${params}`);
  return res.readings.map(mapReading);
}

export interface LiveTelemetryResult {
  view: StationView | null;
  extras: LiveTelemetryExtras | null;
  /** Overall data-fetch status. "offline" here specifically means the API
   * answered but this station has never reported anything at all — not a
   * request failure (that's "error"). */
  status: FetchStatus;
  errorMessage: string | null;
  /** Whether the WebSocket is currently open and subscribed — surfaced so
   * the UI can show "reconnecting…" during a network blip rather than
   * silently going stale with no indication (NFR-3.2). */
  socketState: SocketConnectionState;
  refetch: () => void;
}

/**
 * The Live Dashboard's single data source. Fetches minute/hour/day
 * telemetry + the latest reading over REST, derives every card's data via
 * deriveStationView.ts, and layers the WebSocket on top for live updates —
 * new readings arrive via `dashboardSocket` and get merged in without a
 * full re-fetch, except right after a (re)connect, where a REST re-fetch
 * happens first (system-architecture.md §4 Finding #10; see websocket.ts).
 */
export function useLiveTelemetry(stationId: string): LiveTelemetryResult {
  const [latest, setLatest] = useState<StationReading | null>(null);
  const [minuteReadings, setMinuteReadings] = useState<StationReading[]>([]);
  const [hourlyReadings, setHourlyReadings] = useState<StationReading[]>([]);
  const [dailyReadings, setDailyReadings] = useState<StationReading[]>([]);
  const [status, setStatus] = useState<FetchStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [socketState, setSocketState] = useState<SocketConnectionState>("closed");
  const [refetchToken, setRefetchToken] = useState(0);

  // Kept in a ref so the WS resync callback (registered once per
  // stationId, not per render) always fetches for the *current*
  // stationId even though it closes over this function.
  const fetchAllRef = useRef<() => void>(() => {});

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setStatus((s) => (s === "ready" ? s : "loading")); // don't flash a skeleton on a background resync
      setErrorMessage(null);
      try {
        const now = new Date();
        const [minute, hourly, daily, latestReading] = await Promise.all([
          fetchResolution(stationId, "minute", new Date(now.getTime() - MINUTE_WINDOW * 60 * 1000)),
          fetchResolution(stationId, "hour", new Date(now.getTime() - HOURLY_WINDOW_HOURS * 60 * 60 * 1000)),
          fetchResolution(stationId, "day", new Date(now.getTime() - DAILY_WINDOW_DAYS * 24 * 60 * 60 * 1000)),
          apiFetch<Parameters<typeof mapReading>[0] & { status?: string }>(`/telemetry/${stationId}/latest`),
        ]);
        if (cancelled) return;
        setMinuteReadings(minute);
        setHourlyReadings(hourly);
        setDailyReadings(daily);
        setLatest(mapReading(latestReading));
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          // Reachable API, but this station has never reported — a real,
          // distinct state from a broken request.
          setLatest(null);
          setMinuteReadings([]);
          setHourlyReadings([]);
          setDailyReadings([]);
          setStatus("offline");
          return;
        }
        setErrorMessage(err instanceof ApiError ? err.message : "Could not reach the telemetry API.");
        setStatus("error");
      }
    }

    fetchAllRef.current = fetchAll;
    fetchAll();

    const unsubscribeResync = dashboardSocket.onResync(() => fetchAllRef.current());
    const unsubscribeState = dashboardSocket.onConnectionStateChange(setSocketState);
    const unsubscribeMessages = dashboardSocket.subscribe(stationId, (msg) => {
      if (msg.station_id !== stationId) return;
      if ("reading" in msg) {
        const reading = mapReading((msg as ReadingMessage).reading as unknown as Parameters<typeof mapReading>[0]);
        setLatest(reading);
        setMinuteReadings((prev) => [...prev.slice(-(MINUTE_WINDOW - 1)), reading]);
      } else if ("status" in msg) {
        if ((msg as StatusMessage).status === "offline") {
          setStatus("offline");
        }
      }
    });
    dashboardSocket.connect();

    return () => {
      cancelled = true;
      unsubscribeResync();
      unsubscribeState();
      unsubscribeMessages();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationId, refetchToken]);

  const view =
    status === "ready" || status === "offline"
      ? deriveStationView({ latest, minuteReadings, hourlyReadings, dailyReadings })
      : null;
  const extras =
    status === "ready" || status === "offline"
      ? deriveLiveExtras({ stationId, latest, minuteReadings, hourlyReadings, dailyReadings, totalReadingsCount: null })
      : null;

  return {
    view,
    extras,
    status,
    errorMessage,
    socketState,
    refetch: () => setRefetchToken((n) => n + 1),
  };
}