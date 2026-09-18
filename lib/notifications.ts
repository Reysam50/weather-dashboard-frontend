export type NotificationSeverity = "critical" | "warning" | "info";

export interface AppNotification {
  id: string;
  severity: NotificationSeverity;
  title: string;
  message: string;
  timestamp: string; // ISO
  read: boolean;
}

export const SEVERITY_STYLES: Record<NotificationSeverity, { icon: string; color: string; bg: string }> = {
  critical: { icon: "error", color: "text-error", bg: "bg-error/10 border-error/25" },
  warning: { icon: "warning", color: "text-secondary", bg: "bg-secondary/10 border-secondary/25" },
  info: { icon: "info", color: "text-primary-container", bg: "bg-primary-container/10 border-primary-container/25" },
};

/**
 * Seed history so the panel isn't empty before a real backend/WebSocket
 * push exists (FR references station-offline and threshold-breach
 * alerts). TODO (frontend developer): replace with a real subscription —
 * likely a WebSocket channel per system-architecture.md, calling
 * NotificationsContext's addNotification() as events arrive, instead of
 * this static seed.
 */
export function buildSeedNotifications(): AppNotification[] {
  const now = Date.now();
  return [
    {
      id: "seed-1",
      severity: "critical",
      title: "Station Offline",
      message: "Blantyre CBD has not reported telemetry in over 13 hours. Dual-pipe fallback is active.",
      timestamp: new Date(now - 45 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: "seed-2",
      severity: "warning",
      title: "Threshold Exceeded",
      message: "Zomba Plateau air temperature crossed the configured warm-band threshold (>32°C).",
      timestamp: new Date(now - 3 * 3600 * 1000).toISOString(),
      read: false,
    },
    {
      id: "seed-3",
      severity: "info",
      title: "Firmware Update Available",
      message: "v2.4.2-aws is available for stations currently running v2.4.1-aws.",
      timestamp: new Date(now - 26 * 3600 * 1000).toISOString(),
      read: true,
    },
  ];
}