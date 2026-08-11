import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, extractError } from "../api/client";
import type { Lead, LeadStatus } from "../api/types";
import { useToast } from "../context/ToastContext";
import { PillBadge, StatBadge } from "../components/StatBadge";
import { CardSkeleton } from "../components/LoadingSkeleton";
import { ErrorState, EmptyState } from "../components/ErrorState";

const STATUS_STYLES: Record<LeadStatus, { badge: string; label: string }> = {
  PENDING: { badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300", label: "Pending" },
  ACCEPTED: { badge: "bg-green-100 text-green-700 dark:bg-emerald-500/15 dark:text-emerald-300", label: "Accepted" },
  DECLINED: { badge: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300", label: "Declined" },
};

const STATUS_FILTERS: { value: "ALL" | LeadStatus; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "DECLINED", label: "Declined" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function PlatformLeadsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"ALL" | LeadStatus>("ALL");

  const leadsQuery = useQuery({
    queryKey: ["leads"],
    queryFn: () => api.get<{ data: Lead[] }>("/leads").then((r) => r.data.data),
  });

  const handleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "ACCEPTED" | "DECLINED" }) => {
      const res = await api.patch<{ data: Lead }>(`/leads/${id}`, { status });
      return res.data.data;
    },
    onSuccess: (lead) => {
      toast(lead.status === "ACCEPTED" ? `Demo request from ${lead.schoolName} accepted` : `Demo request from ${lead.schoolName} declined`);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (err) => toast(extractError(err), "error"),
  });

  const counts = useMemo(() => {
    const all = leadsQuery.data ?? [];
    return {
      total: all.length,
      pending: all.filter((l) => l.status === "PENDING").length,
      accepted: all.filter((l) => l.status === "ACCEPTED").length,
      declined: all.filter((l) => l.status === "DECLINED").length,
    };
  }, [leadsQuery.data]);

  const visible = useMemo(() => {
    const all = leadsQuery.data ?? [];
    return filter === "ALL" ? all : all.filter((l) => l.status === filter);
  }, [leadsQuery.data, filter]);

  if (leadsQuery.isLoading) {
    return (
      <div>
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} lines={2} />
          ))}
        </div>
      </div>
    );
  }

  if (leadsQuery.isError) {
    return <ErrorState onRetry={() => leadsQuery.refetch()} />;
  }

  return (
    <div>
      <div>
        <PillBadge>Platform admin</PillBadge>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink">Demo requests</h1>
        <p className="mt-1 text-sm text-muted">
          Review and respond to demo-booking requests submitted from the landing page.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatBadge value={String(counts.total)} label="Total" />
        <StatBadge value={String(counts.pending)} label="Pending" />
        <StatBadge value={String(counts.accepted)} label="Accepted" />
        <StatBadge value={String(counts.declined)} label="Declined" />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              filter === f.value ? "bg-primary text-white" : "border border-border-soft bg-card text-muted hover:text-ink"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        {visible.length === 0 && (
          <EmptyState title="No demo requests here" message="New requests from the landing page will show up here." />
        )}
        {visible.map((lead) => {
          const status = STATUS_STYLES[lead.status];
          return (
            <div
              key={lead.id}
              className="rounded-card border border-border-soft bg-card p-6 shadow-soft"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-ink">{lead.schoolName}</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.badge}`}>{status.label}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {lead.fullName} · <a href={`mailto:${lead.workEmail}`} className="text-primary hover:underline">{lead.workEmail}</a> · {lead.studentCount} students
                  </p>
                </div>
                <p className="text-xs text-muted">Submitted {formatDate(lead.createdAt)}</p>
              </div>

              {lead.message && (
                <p className="mt-3 rounded-xl bg-canvas px-4 py-3 text-sm leading-relaxed text-ink">{lead.message}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                {lead.status === "PENDING" ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleMutation.mutate({ id: lead.id, status: "ACCEPTED" })}
                      disabled={handleMutation.isPending}
                      className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-white transition hover:bg-primary-dark disabled:opacity-60"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleMutation.mutate({ id: lead.id, status: "DECLINED" })}
                      disabled={handleMutation.isPending}
                      className="rounded-full border border-border-soft bg-canvas px-5 py-2 text-sm font-semibold text-muted transition hover:border-red-300 hover:text-red-600 disabled:opacity-60 dark:hover:border-red-500/40 dark:hover:text-red-400"
                    >
                      Decline
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-muted">
                    {lead.status === "ACCEPTED" ? "Accepted" : "Declined"} by {lead.handledBy?.firstName} {lead.handledBy?.lastName}
                    {lead.handledAt ? ` on ${formatDate(lead.handledAt)}` : ""}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
