export function ErrorState({ title, message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-red-100 bg-red-50 p-10 text-center dark:border-red-500/20 dark:bg-red-500/10">
      <div className="text-3xl">😕</div>
      <h3 className="mt-3 text-lg font-bold text-ink">{title ?? "Something went wrong"}</h3>
      <p className="mt-1 max-w-md text-sm text-muted">{message ?? "We couldn't load this. Please try again."}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, message, action }: { title: string; message?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border-soft bg-card p-10 text-center">
      <div className="text-3xl">📭</div>
      <h3 className="mt-3 text-lg font-bold text-ink">{title}</h3>
      {message && <p className="mt-1 max-w-md text-sm text-muted">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
