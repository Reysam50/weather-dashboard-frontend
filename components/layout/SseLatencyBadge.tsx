"use client";

import { useEffect, useState } from "react";
import { useAdminSettings } from "@/lib/AdminSettingsContext";

/**
 * Cosmetic stand-in for the real SSE stream's round-trip latency. There's
 * no backend/SSE connection yet, so this ticks a small jittering number
 * rather than showing a fixed, obviously-fake "18ms" forever — once the
 * real EventSource connection exists, swap the interval below for the
 * actual measured latency per message.
 *
 * The "…s INT" label is real, though — it reads the polling interval from
 * the shared AdminSettingsContext, so changing it on the Admin screen
 * updates this badge immediately, with no reload needed.
 */
export default function SseLatencyBadge() {
  const { settings } = useAdminSettings();
  const [latencyMs, setLatencyMs] = useState(18);

  useEffect(() => {
    const id = setInterval(() => {
      setLatencyMs(12 + Math.round(Math.random() * 14));
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-card-bg border border-border-line">
      <div className="flex flex-col text-right font-mono text-[9px] leading-tight">
        <span className="text-cyan-400 font-medium">{latencyMs}ms</span>
        <span className="text-on-surface-variant">{settings.pollingIntervalSec}s INT</span>
      </div>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
      </span>
    </div>
  );
}