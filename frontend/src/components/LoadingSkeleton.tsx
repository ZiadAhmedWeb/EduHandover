export function LoadingSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-light border-t-primary" />
        <p className="text-sm font-medium text-muted">Loading…</p>
      </div>
    </div>
  );
}

export function CardSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="rounded-card border border-border-soft bg-card p-6 shadow-soft">
      <div className="h-4 w-1/3 animate-pulse rounded-full bg-border-soft" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-3 animate-pulse rounded-full bg-border-soft/60" style={{ width: `${100 - i * 12}%` }} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
