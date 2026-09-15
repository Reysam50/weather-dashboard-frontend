/**
 * Formats an ISO timestamp as a short relative string ("5m ago", "3h ago").
 * Used anywhere FR-10.2 requires showing "last successful data reception
 * time" (station status) or the reference dashboard's "Last update Xd ago"
 * card footer.
 */
export function formatTimeAgo(isoTimestamp: string | null): string {
  if (!isoTimestamp) return "Never";

  const diffMs = Date.now() - new Date(isoTimestamp).getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

/**
 * Same idea as formatTimeAgo, but keeps second-level precision below a
 * minute ("42s ago") instead of collapsing straight to "Just now". Added
 * for the header's station dropdown (AppHeader.tsx), which — per the Live
 * Telemetry redesign — shows exactly this granularity per station
 * ("Chancellor College [42s ago]"). formatTimeAgo itself is untouched so
 * every existing caller keeps its current wording.
 */
export function formatTimeAgoPrecise(isoTimestamp: string | null): string {
  if (!isoTimestamp) return "Never";

  const diffMs = Date.now() - new Date(isoTimestamp).getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return `${Math.max(diffSec, 0)}s ago`;
  return formatTimeAgo(isoTimestamp);
}