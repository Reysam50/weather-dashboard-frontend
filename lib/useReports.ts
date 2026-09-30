"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError } from "./api";
import { mapGeneratedReport, mapReportSchedule } from "./apiMappers";
import type { FetchStatus, GeneratedReport, ReportSchedule } from "./types";

type ScheduleInput = {
  stationId: string | null;
  frequency: ReportSchedule["frequency"];
  format: ReportSchedule["format"];
  customDate?: string;
  customTime?: string;
};

/**
 * Reports screen data — GET/POST/DELETE /reports/schedules and
 * GET /reports/generated (api-specification.md §6). Mutations no longer
 * fall back to a local-only success when the API is unreachable: a failed
 * create/delete surfaces as `actionError` and leaves the list untouched,
 * so the UI never claims a schedule exists that the server never saw.
 */
export function useReports() {
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [generated, setGenerated] = useState<GeneratedReport[]>([]);
  const [status, setStatus] = useState<FetchStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setErrorMessage(null);
    Promise.all([
      apiFetch<Parameters<typeof mapReportSchedule>[0][]>("/reports/schedules"),
      apiFetch<Parameters<typeof mapGeneratedReport>[0][]>("/reports/generated"),
    ])
      .then(([s, g]) => {
        if (cancelled) return;
        setSchedules(s.map(mapReportSchedule));
        setGenerated(g.map(mapGeneratedReport));
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMessage(err instanceof ApiError ? err.message : "Could not reach the reports API.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [refetchToken]);

  const createSchedule = useCallback(async (input: ScheduleInput) => {
    setActionError(null);
    try {
      const body: Record<string, unknown> = {
        station_id: input.stationId,
        frequency: input.frequency,
        format: input.format,
      };
      // One-time custom run: the UI collects a date + time, which the API
      // takes as a single `run_at` timestamp (api-specification.md §6).
      if (input.frequency === "custom" && input.customDate && input.customTime) {
        body.run_at = new Date(`${input.customDate}T${input.customTime}`).toISOString();
      }
      const created = await apiFetch<Parameters<typeof mapReportSchedule>[0]>("/reports/schedules", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setSchedules((prev) => [...prev, mapReportSchedule(created)]);
    } catch (err) {
      setActionError(
        err instanceof ApiError && err.status === 403
          ? "You don't have permission to schedule reports for all stations."
          : "Couldn't create the schedule. Please try again."
      );
    }
  }, []);

  const deleteSchedule = useCallback(async (id: string) => {
    setActionError(null);
    try {
      await apiFetch(`/reports/schedules/${id}`, { method: "DELETE" });
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setActionError("Couldn't delete the schedule. Please try again.");
    }
  }, []);

  return {
    schedules,
    generated,
    status,
    errorMessage,
    actionError,
    createSchedule,
    deleteSchedule,
    refetch: () => setRefetchToken((n) => n + 1),
  };
}