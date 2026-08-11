export function StatBadge({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-card border border-border-soft bg-card px-6 py-5 shadow-soft">
      <span className="text-2xl font-extrabold text-primary sm:text-3xl">{value}</span>
      <span className="mt-1 text-xs font-medium text-muted sm:text-sm">{label}</span>
    </div>
  );
}

export function PillBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary-light px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
      {children}
    </span>
  );
}
