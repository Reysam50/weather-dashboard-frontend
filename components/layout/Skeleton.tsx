/**
 * Shared skeleton-loading building blocks. Next.js shows each route
 * segment's loading.tsx automatically (wrapping the page in a Suspense
 * boundary) while that segment's content is being fetched/rendered — so
 * these only need to exist per-screen; nothing imports or renders them
 * directly. See app/(protected)/{dashboard,compare,reports,stations,admin}/loading.tsx.
 *
 * Every screen still reads its data from synchronous mock modules today,
 * so these skeletons flash by almost instantly — they're here mainly so
 * the loading state is already correct once real (network-latency-bound)
 * API calls replace the mocks, per the backend-integration TODOs
 * scattered through this repo.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-800/60 ${className}`} />;
}

/** A generic card shell matching the app's standard card chrome
 * (bg-card-bg, rounded-2xl, border-border-line, p-7) with a title-bar
 * skeleton and however many body rows are passed in. */
export function SkeletonCard({
  bodyRows = 3,
  bodyHeight = "h-24",
  className = "",
}: {
  bodyRows?: number;
  bodyHeight?: string;
  className?: string;
}) {
  return (
    <div className={`bg-card-bg rounded-2xl p-7 border border-border-line ${className}`}>
      <div className="flex items-center justify-between pb-5 border-b border-border-line">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="mt-5 space-y-3">
        {Array.from({ length: bodyRows }).map((_, i) => (
          <Skeleton key={i} className={`w-full ${bodyHeight}`} />
        ))}
      </div>
    </div>
  );
}

/** A table shell: header row + N body rows of evenly-spaced cells,
 * matching the app's standard font-mono data tables (TelemetryLogTable,
 * ComparisonMatrixTable, FleetInventoryTable, UserTable, ...). */
export function SkeletonTable({ rows = 6, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-card-bg rounded-2xl border border-border-line overflow-hidden">
      <div className="p-5 border-b border-border-line flex items-center justify-between">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>
      <div className="p-5 space-y-4">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={c} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}