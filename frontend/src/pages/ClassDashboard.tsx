import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { StudentSummary, TagGroups } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { StatusChip, handoverStatusKind } from "../components/StatusChip";
import { SkeletonGrid } from "../components/LoadingSkeleton";
import { ErrorState } from "../components/ErrorState";
import { PillBadge } from "../components/StatBadge";

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function StudentCard({
  student,
  canCreate,
  isReviewer,
}: {
  student: StudentSummary;
  canCreate: boolean;
  isReviewer: boolean;
}) {
  const h = student.handover;
  const kind = handoverStatusKind(h);
  const review = Boolean(h) && kind === "SUBMITTED" && isReviewer;

  return (
    <div className="flex flex-col rounded-card border border-border-soft bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-light text-sm font-extrabold text-primary">
            {initials(student.firstName, student.lastName)}
          </span>
          <div>
            <p className="font-bold text-ink">
              {student.firstName} {student.lastName}
            </p>
            <p className="text-xs text-muted">
              {student.gradeLevel}
              {student.currentClass ? ` · ${student.currentClass.name}` : ""}
            </p>
          </div>
        </div>
        <StatusChip status={kind} />
      </div>

      <div className="mt-5 flex gap-2">
        {!h && canCreate && (
          <Link
            to={`/handover/${student.id}`}
            className="flex-1 rounded-full bg-cta px-4 py-2 text-center text-xs font-bold text-ink transition hover:bg-cta-dark"
          >
            Create handover
          </Link>
        )}
        {!h && !canCreate && (
          <span className="flex-1 rounded-full bg-slate-100 px-4 py-2 text-center text-xs font-semibold text-slate-500 dark:bg-slate-500/15 dark:text-slate-300">
            Unlocks after 6 months at school
          </span>
        )}
        {h && review && (
          <Link
            to={`/students/${student.id}`}
            className="flex-1 rounded-full bg-cta px-4 py-2 text-center text-xs font-bold text-ink transition hover:bg-cta-dark"
          >
            Review profile
          </Link>
        )}
        {h && !review && (
          <Link
            to={`/students/${student.id}`}
            className={`flex-1 rounded-full px-4 py-2 text-center text-xs font-bold transition ${
              kind === "ACKNOWLEDGED"
                ? "border border-border-soft bg-canvas text-muted hover:text-primary"
                : "border border-border-soft bg-canvas text-ink hover:text-primary"
            }`}
          >
            View profile
          </Link>
        )}
      </div>
    </div>
  );
}

export default function ClassDashboard() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState<string | null>(null);

  const studentsQuery = useQuery({
    queryKey: ["dashboard-students", tag],
    queryFn: () =>
      api
        .get<{ data: StudentSummary[] }>("/dashboard/students", { params: tag ? { tag } : undefined })
        .then((r) => r.data.data),
  });

  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: () => api.get<{ data: TagGroups }>("/tags").then((r) => r.data.data),
    enabled: !!user,
  });

  const isAdmin = user?.role === "ADMIN";
  const canCreate = user?.canCreateHandovers ?? false;

  const allTagOptions = useMemo(() => {
    const groups = tagsQuery.data;
    if (!groups) return [];
    return [
      ...groups.learningStyles,
      ...groups.focusTriggers,
      ...groups.behavioralStrengths,
    ];
  }, [tagsQuery.data]);

  const filtered = useMemo(() => {
    const list = studentsQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (s) => `${s.firstName} ${s.lastName}`.toLowerCase().includes(q)
    );
  }, [studentsQuery.data, search]);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <PillBadge>{isAdmin ? "School overview" : "My class"}</PillBadge>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink">
            {isAdmin ? "All students" : "Your students"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {isAdmin
              ? "Review and manage handovers across your school."
              : "Create or review a handover for each student."}
          </p>
        </div>
        <div className="w-full sm:w-72">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students…"
            className="w-full rounded-xl border border-border-soft bg-card px-4 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setTag(null)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            !tag ? "bg-ink text-white" : "bg-card text-muted border border-border-soft hover:text-ink"
          }`}
        >
          All students
        </button>
        {allTagOptions.map((t) => (
          <button
            key={t.slug}
            onClick={() => setTag(tag === t.slug ? null : t.slug)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              tag === t.slug
                ? "bg-primary text-white"
                : "bg-card text-muted border border-border-soft hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {studentsQuery.isLoading ? (
        <div className="mt-8">
          <SkeletonGrid count={6} />
        </div>
      ) : studentsQuery.isError ? (
        <div className="mt-8">
          <ErrorState onRetry={() => studentsQuery.refetch()} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-card border border-dashed border-border-soft bg-card p-12 text-center">
          <p className="text-lg font-bold text-ink">No students found</p>
          <p className="mt-1 text-sm text-muted">
            {tag ? "Try a different tag filter or clear it." : "You don't have any students yet."}
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <StudentCard
              key={s.id}
              student={s}
              canCreate={canCreate}
              isReviewer={s.handover?.receiver?.id === user?.id && (user?.canAcknowledgeHandovers ?? false)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
