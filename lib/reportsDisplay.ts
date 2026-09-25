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

function formatCustomDateTime(customDate?: string, customTime?: string): string | null {
  if (!customDate) return null;
  const iso = customTime ? `${customDate}T${customTime}` : customDate;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}${
    customTime ? ` @ ${customTime}` : ""
  }`;
}

export function recurrenceLabel(schedule: Pick<ReportSchedule, "frequency" | "customDate" | "customTime">): string {
  switch (schedule.frequency) {
    case "daily":
      return "Daily @ 08:00 UTC";
    case "weekly":
      return "Weekly @ Sun 23:59";
    case "monthly":
      return "Monthly (1st) 00:00";
    case "custom": {
      const formatted = formatCustomDateTime(schedule.customDate, schedule.customTime);
      return formatted ? `Custom — ${formatted}` : "Custom cadence";
    }
  }
}

/** Purely a display estimate for "next run" — not backed by a real
 * scheduler yet, so this is derived from the frequency each render
 * rather than stored anywhere (except for "custom", which now has a real
 * stored date/time to compute from). */
export function nextRunLabel(schedule: Pick<ReportSchedule, "frequency" | "customDate" | "customTime">): string {
  const now = new Date();
  switch (schedule.frequency) {
    case "daily": {
      return `Tomorrow 08:00`;
    }
    case "weekly": {
      const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
      return `In ${daysUntilSunday} Day${daysUntilSunday === 1 ? "" : "s"}`;
    }
    case "monthly": {
      const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return next.toLocaleDateString(undefined, { day: "2-digit", month: "short" }) + " 00:00";
    }
    case "custom": {
      const formatted = formatCustomDateTime(schedule.customDate, schedule.customTime);
      return formatted ?? "Not scheduled";
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