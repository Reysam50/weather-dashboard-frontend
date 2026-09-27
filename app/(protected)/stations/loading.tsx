import { Skeleton, SkeletonTable } from "@/components/layout/Skeleton";

export default function StationsLoading() {
  return (
    <div className="space-y-6">
      {/* HUD strip */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-card-bg border border-border-line">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-10 w-56 rounded-xl" />
      </div>

      {/* Map canvas */}
      <Skeleton className="h-[560px] w-full rounded-2xl" />

      {/* Fleet inventory table */}
      <SkeletonTable rows={6} columns={7} />
    </div>
  );
}