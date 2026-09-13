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