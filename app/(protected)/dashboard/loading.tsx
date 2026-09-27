import { Skeleton, SkeletonCard, SkeletonTable } from "@/components/layout/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Hero metrics row (air temp / humidity / rain / pressure) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card-bg rounded-2xl p-6 border border-border-line">
            <div className="flex items-center justify-between pb-3 border-b border-border-line">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
            <Skeleton className="h-10 w-32 mt-5" />
          </div>
        ))}
      </div>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-8 space-y-8">
          <SkeletonCard bodyRows={1} bodyHeight="h-64" />
          <SkeletonCard bodyRows={1} bodyHeight="h-64" />
          <SkeletonCard bodyRows={1} bodyHeight="h-80" />
          <SkeletonCard bodyRows={1} bodyHeight="h-80" />
          <SkeletonCard bodyRows={1} bodyHeight="h-80" />
        </div>
        <div className="xl:col-span-4 space-y-8">
          <SkeletonCard bodyRows={3} bodyHeight="h-16" />
          <SkeletonCard bodyRows={2} bodyHeight="h-20" />
          <SkeletonCard bodyRows={2} bodyHeight="h-12" />
        </div>
      </section>

      <SkeletonTable rows={8} columns={10} />
    </div>
  );
}