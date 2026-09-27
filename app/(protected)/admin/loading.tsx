import { Skeleton, SkeletonTable } from "@/components/layout/Skeleton";

export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-5">
      {/* HUD strip */}
      <div className="w-full bg-card-bg rounded-2xl px-4 py-2.5 flex items-center justify-between border border-border-line">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-32 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      {/* Roster metric chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </div>

      {/* User roster table */}
      <SkeletonTable rows={6} columns={6} />
    </div>
  );
}