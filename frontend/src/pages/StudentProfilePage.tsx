import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { api, extractError } from "../api/client";
import type { HandoverProfile, TagGroups } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { TagPill } from "../components/TagPill";
import { CardSkeleton } from "../components/LoadingSkeleton";
import { ErrorState } from "../components/ErrorState";
import { StatusChip, handoverStatusKind } from "../components/StatusChip";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function StudentProfilePage() {
  const { studentId = "" } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["profile", studentId],
    queryFn: () =>
      api.get<{ data: HandoverProfile }>(`/handovers/student/${studentId}`).then((r) => r.data.data),
    retry: false,
  });

  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: () => api.get<{ data: TagGroups }>("/tags").then((r) => r.data.data),
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ data: HandoverProfile }>(
        `/handovers/${profileQuery.data!.id}/acknowledge`
      );
      return res.data.data;
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(["profile", studentId], profile);
      queryClient.invalidateQueries({ queryKey: ["dashboard-students"] });
      toast(`${profile.student.firstName}'s profile acknowledged`);
    },
    onError: (err) => toast(extractError(err), "error"),
  });

  if (profileQuery.isLoading) {
    return (
      <div className="mx-auto max-w-3xl">
        <CardSkeleton lines={10} />
      </div>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState
          message="No submitted handover profile was found for this student, or you don't have access."
        />
        <div className="mt-4 text-center">
          <Link to="/dashboard" className="text-sm font-semibold text-primary hover:underline">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const profile = profileQuery.data;
  const tags = tagsQuery.data;
  const kind = handoverStatusKind(profile);
  const isReceiver = user?.id === profile.receiverId;
  const canAcknowledge =
    isReceiver && kind === "SUBMITTED" && (user?.canAcknowledgeHandovers ?? false);

  const tagLabel = (slug: string, key: keyof TagGroups) =>
    tags?.[key]?.find((t) => t.slug === slug)?.label ?? slug;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-lg font-extrabold text-white">
            {profile.student.firstName[0]}
            {profile.student.lastName[0]}
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">
              {profile.student.firstName} {profile.student.lastName}
            </h1>
            <p className="text-sm text-muted">
              {profile.student.gradeLevel} · Handover year {profile.academicYear}
            </p>
          </div>
        </div>
        <StatusChip status={kind} />
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        <div className="rounded-card border border-border-soft bg-card p-6 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Learning styles</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.learningStyles.map((s) => (
              <TagPill key={s} label={tagLabel(s, "learningStyles")} category="learningStyles" />
            ))}
          </div>
        </div>
        <div className="rounded-card border border-border-soft bg-card p-6 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Focus triggers</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.focusTriggers.map((s) => (
              <TagPill key={s} label={tagLabel(s, "focusTriggers")} category="focusTriggers" />
            ))}
          </div>
        </div>
        <div className="rounded-card border border-border-soft bg-card p-6 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Behavioral strengths</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.behavioralTags.map((s) => (
              <TagPill key={s} label={tagLabel(s, "behavioralStrengths")} category="behavioralTags" />
            ))}
          </div>
        </div>
      </div>

      {profile.notes && (
        <div className="mt-5 rounded-card border border-border-soft bg-card p-6 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Notes from the teacher</p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink">{profile.notes}</p>
        </div>
      )}

      <div className="mt-5 rounded-card border border-border-soft bg-card p-6 shadow-soft">
        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Created by</p>
            <p className="mt-1 font-semibold text-ink">
              {profile.creator.firstName} {profile.creator.lastName}
            </p>
            <p className="text-xs text-muted">{formatDate(profile.submittedAt)}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Reviewing teacher</p>
            <p className="mt-1 font-semibold text-ink">
              {profile.receiver ? `${profile.receiver.firstName} ${profile.receiver.lastName}` : "Not assigned yet"}
            </p>
            {profile.acknowledgedAt && (
              <p className="text-xs text-accent">Acknowledged {formatDate(profile.acknowledgedAt)}</p>
            )}
          </div>
        </div>
      </div>

      {canAcknowledge && (
        <div className="mt-6 rounded-card border border-accent/30 bg-accent-light/50 p-6 text-center shadow-soft">
          <p className="text-sm font-semibold text-ink">Day 1 ready?</p>
          <p className="mt-1 text-xs text-muted">
            Confirm you've reviewed this profile. This logs your receipt for the school.
          </p>
          <button
            onClick={() => acknowledgeMutation.mutate()}
            disabled={acknowledgeMutation.isPending}
            className="mt-4 rounded-full bg-accent px-7 py-3 text-sm font-bold text-white transition hover:bg-green-600 disabled:opacity-60"
          >
            {acknowledgeMutation.isPending ? "Acknowledging…" : "✓ Acknowledge profile"}
          </button>
        </div>
      )}

      <div className="mt-6 text-center">
        <Link to="/dashboard" className="text-sm font-semibold text-primary hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
