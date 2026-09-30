/**
 * Shown in place of a card's normal body when the sensor(s) it depends on
 * aren't reporting — a `null` in a derived StationView/LiveTelemetryExtras
 * field (see lib/deriveStationView.ts) means exactly that: the reading
 * genuinely wasn't there, not "still loading." Loading has its own state
 * (each screen's loading.tsx, plus an in-page spinner for client-side
 * re-fetches after the initial page load — see app/(protected)/dashboard/page.tsx).
 */
export function OfflineCardBody({
  label = "No Data",
  detail = "This sensor hasn't reported a reading.",
}: {
  label?: string;
  detail?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <span className="material-symbols-outlined text-[28px] text-slate-600">sensors_off</span>
      <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="font-mono text-[11px] text-slate-600 max-w-[220px]">{detail}</span>
    </div>
  );
}

/** For one value inside an otherwise-fine card (e.g. wind gust when speed
 * is present) — an inline dash rather than blanking the whole card. */
export function offlineValueOr<T>(value: T | null, format: (v: T) => string): string {
  return value === null ? "—" : format(value);
}