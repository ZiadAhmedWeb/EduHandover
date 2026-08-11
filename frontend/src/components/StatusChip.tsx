export type HandoverStatusKind = "NONE" | "DRAFT" | "SUBMITTED" | "ACKNOWLEDGED" | "ARCHIVED";

const STYLES: Record<HandoverStatusKind, string> = {
  NONE: "bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-300",
  DRAFT: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  SUBMITTED: "bg-primary-light text-primary",
  ACKNOWLEDGED: "bg-accent-light text-green-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  ARCHIVED: "bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-300",
};

const LABELS: Record<HandoverStatusKind, string> = {
  NONE: "No handover",
  DRAFT: "Draft",
  SUBMITTED: "Pending review",
  ACKNOWLEDGED: "Acknowledged",
  ARCHIVED: "Archived",
};

export function handoverStatusKind(h: {
  status: string;
  isAcknowledged: boolean;
} | null): HandoverStatusKind {
  if (!h) return "NONE";
  if (h.status === "DRAFT") return "DRAFT";
  if (h.status === "ARCHIVED") return "ARCHIVED";
  if (h.isAcknowledged) return "ACKNOWLEDGED";
  return "SUBMITTED";
}

export function StatusChip({ status }: { status: HandoverStatusKind }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${STYLES[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {LABELS[status]}
    </span>
  );
}
