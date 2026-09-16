import type { ReportSchedule, GeneratedReport } from "./types";

/**
 * TODO (frontend developer): replace with real fetches to GET
 * /reports/schedules and GET /reports/generated once the backend exists
 * (api-specification.md §6).
 */
export const mockSchedules: ReportSchedule[] = [
  { id: "s1", stationId: "1", frequency: "daily", format: "csv", createdBy: "Kai Banda" },
  { id: "s2", stationId: null, frequency: "weekly", format: "xlsx", createdBy: "System Automation" },
  { id: "s3", stationId: "2", frequency: "monthly", format: "pdf", createdBy: "Hydrology Dept" },
];

export const mockGeneratedReports: GeneratedReport[] = [
  {
    id: "g1",
    scheduleId: "s1",
    stationId: "1",
    generatedAt: "2026-09-06T08:00:00Z",
    format: "csv",
    fileName: "chancellor-college_2026-09-06.csv",
  },
  {
    id: "g2",
    scheduleId: "s1",
    stationId: "1",
    generatedAt: "2026-09-05T08:00:00Z",
    format: "csv",
    fileName: "chancellor-college_2026-09-05.csv",
  },
  {
    id: "g3",
    scheduleId: "s2",
    stationId: null,
    generatedAt: "2026-09-01T08:00:00Z",
    format: "xlsx",
    fileName: "all-stations-week_2026-W35.xlsx",
  },
  {
    id: "g4",
    scheduleId: "s3",
    stationId: "2",
    generatedAt: "2026-08-31T23:59:12Z",
    format: "pdf",
    fileName: "zomba-plateau-hydrology_aug2026.pdf",
  },
];