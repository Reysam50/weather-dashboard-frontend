import { Skeleton, SkeletonCard, SkeletonTable } from "@/components/layout/Skeleton";

export default function CompareLoading() {
  return (
    <div className="space-y-6">
      {/* HUD strip */}
      <div className="flex items-center justify-between gap-3 px-5 py-2.5 rounded-2xl bg-card-bg border border-border-line">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Title + control ribbon */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-72" />
          <Skeleton className="h-7 w-96" />
        </div>
        <Skeleton className="h-9 w-72 rounded-xl" />
      </div>

      {/* Station summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <SkeletonCard bodyRows={2} bodyHeight="h-10" />
        <SkeletonCard bodyRows={2} bodyHeight="h-10" />
      </div>

      {/* Hero temperature chart */}
      <SkeletonCard bodyRows={1} bodyHeight="h-72" />

      {/* Humidity / Pressure / Rainfall / Wind Speed grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} bodyRows={1} bodyHeight="h-48" />
        ))}
      </div>

      {/* Wind direction chart */}
      <SkeletonCard bodyRows={1} bodyHeight="h-48" />

      {/* Comparative Telemetry Analytics Matrix */}
      <SkeletonTable rows={6} columns={8} />
    </div>
  );
}