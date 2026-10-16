import type { ReportFormat, ReportSchedule } from "./types";

export const FORMAT_STYLES: Record<ReportFormat, string> = {
  csv: "bg-primary-container/15 text-primary-container",
  xlsx: "bg-secondary/15 text-secondary",
  xls: "bg-secondary/15 text-secondary",
  pdf: "bg-tertiary/15 text-tertiary",
};

export const FORMAT_ICONS: Record<ReportFormat, string> = {
  csv: "csv",
  xlsx: "table_view",
  xls: "table_view",
  pdf: "picture_as_pdf",
};

/** The backend cuts scheduled reports at fixed UTC boundaries
 * (accounts/report_runner.py): daily at 00:00 (covering the previous day),
 * weekly on Monday 00:00 (the previous 7 days), monthly on the 1st at 00:00
 * (the previous calendar month). Keep these labels in step with it. */
export function recurrenceLabel(schedule: Pick<ReportSchedule, "frequency">): string {
  switch (schedule.frequency) {
    case "daily":
      return "Daily @ 00:00 UTC";
    case "weekly":
      return "Weekly @ Mon 00:00 UTC";
    case "monthly":
      return "Monthly (1st) 00:00 UTC";
  }
}

/** A display estimate of the next cut, derived from the frequency each render
 * (the API doesn't return a next-run time). Computed in UTC to match the
 * backend's boundaries. */
export function nextRunLabel(schedule: Pick<ReportSchedule, "frequency">): string {
  const now = new Date();
  switch (schedule.frequency) {
    case "daily":
      return "Tomorrow 00:00 UTC";
    case "weekly": {
      const daysUntilMonday = (1 - now.getUTCDay() + 7) % 7 || 7;
      return `In ${daysUntilMonday} Day${daysUntilMonday === 1 ? "" : "s"}`;
    }
    case "monthly": {
      const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
      return (
        next.toLocaleDateString(undefined, { day: "2-digit", month: "short", timeZone: "UTC" }) + " 00:00 UTC"
      );
    }
  }
}

/** Deterministic pseudo file size from the filename — GeneratedReport
 * doesn't carry a real size (no backend yet), so this fakes a plausible,
 * stable-per-file number rather than a random one that changes on every
 * render. */
export function pseudoFileSizeLabel(fileName: string): string {
  const hash = fileName.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const mb = 0.4 + (hash % 90) / 10;
  return `${mb.toFixed(2)} MB`;
}