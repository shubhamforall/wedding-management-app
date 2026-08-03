import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-[var(--radius-sm)] bg-bg-subtle', className)} />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4 pt-6 pb-6">
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-20 w-full rounded-[var(--radius-lg)]" />
      <Skeleton className="h-16 w-full rounded-[var(--radius-lg)]" />
      {Array.from({ length: 4 }).map((_, section) => (
        <div key={section} className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, card) => (
              <Skeleton key={card} className="h-24 w-full rounded-[var(--radius-lg)]" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
