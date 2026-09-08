"use client";

import { useState } from "react";
import QuickExportCard from "@/components/reports/QuickExportCard";
import ScheduleReportCard from "@/components/reports/ScheduleReportCard";
import GeneratedReportsCard from "@/components/reports/GeneratedReportsCard";
import { mockStations } from "@/lib/mockStations";
import { mockSchedules, mockGeneratedReports } from "@/lib/mockReports";
import { CURRENT_ROLE, ASSIGNED_STATION_ID } from "@/lib/mockAuth";
import type { ReportSchedule } from "@/lib/types";

/**
 * Reports screen — FR-8 (ad-hoc data export) + FR-9 (scheduled report
 * generation), per api-specification.md §6.
 *
 * Role scoping (CONFIRMED in the API spec):
 * - Station Operator: every form here is locked to their one assigned
 *   station — "All Stations" never appears as an option.
 * - Administrator / Technical Team: can create All-Stations schedules and
 *   see everyone's schedules/generated reports, not just their own.
 *
 * TODO (frontend developer):
 * - replace mockSchedules/mockGeneratedReports with real fetches to
 *   GET /reports/schedules and GET /reports/generated
 * - wire handleCreateSchedule to POST /reports/schedules and
 *   handleDeleteSchedule to DELETE /reports/schedules/{id}
 */
export default function ReportsPage() {
  const allowAllStations = CURRENT_ROLE !== "station_operator";
  const defaultStationId =
    CURRENT_ROLE === "station_operator"
      ? ASSIGNED_STATION_ID
      : mockStations[0]?.id ?? "1";

  const [schedules, setSchedules] = useState<ReportSchedule[]>(mockSchedules);

  function handleCreateSchedule(input: {
    stationId: string | null;
    frequency: ReportSchedule["frequency"];
    format: ReportSchedule["format"];
  }) {
    // TODO: POST to /reports/schedules — this just appends locally so the
    // flow is testable end-to-end in the meantime.
    setSchedules((prev) => [
      ...prev,
      { id: crypto.randomUUID(), createdBy: "You", ...input },
    ]);
  }

  function handleDeleteSchedule(id: string) {
    // TODO: DELETE /reports/schedules/{id}
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Reports</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-1">
          <QuickExportCard
            stations={mockStations}
            defaultStationId={defaultStationId}
          />
        </div>
        <div className="lg:col-span-2">
          <ScheduleReportCard
            stations={mockStations}
            schedules={schedules}
            allowAllStations={allowAllStations}
            defaultStationId={defaultStationId}
            onCreateSchedule={handleCreateSchedule}
            onDeleteSchedule={handleDeleteSchedule}
          />
        </div>
      </div>

      <GeneratedReportsCard reports={mockGeneratedReports} stations={mockStations} />
    </div>
  );
}