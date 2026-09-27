import { Skeleton, SkeletonCard, SkeletonTable } from "@/components/layout/Skeleton";

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      {/* HUD strip */}
      <div className="flex items-center justify-between gap-3 px-5 py-2.5 rounded-2xl bg-card-bg border border-border-line">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-3 w-64" />
        <Skeleton className="h-7 w-80" />
      </div>

      {/* Quick Export + Schedule cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard bodyRows={4} bodyHeight="h-8" />
        <SkeletonCard bodyRows={3} bodyHeight="h-10" />
      </div>

      {/* Generated reports table */}
      <SkeletonTable rows={5} columns={5} />

      {/* Manual recovery upload */}
      <SkeletonCard bodyRows={1} bodyHeight="h-28" />
    </div>
  );
}