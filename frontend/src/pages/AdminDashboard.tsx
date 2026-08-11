import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, extractError } from "../api/client";
import type { ClassSummary, SchoolInfoResponse, TeacherSummary } from "../api/types";
import { useToast } from "../context/ToastContext";
import { PillBadge, StatBadge } from "../components/StatBadge";
import { SkeletonGrid, CardSkeleton } from "../components/LoadingSkeleton";
import { ErrorState } from "../components/ErrorState";

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [academicYear, setAcademicYear] = useState("2026-2027");
  const [teacherId, setTeacherId] = useState("");

  const schoolQuery = useQuery({
    queryKey: ["school"],
    queryFn: () => api.get<{ data: SchoolInfoResponse }>("/schools/me").then((r) => r.data.data),
  });

  const classesQuery = useQuery({
    queryKey: ["classes"],
    queryFn: () => api.get<{ data: ClassSummary[] }>("/classes").then((r) => r.data.data),
  });

  const teachersQuery = useQuery({
    queryKey: ["teachers"],
    queryFn: () => api.get<{ data: TeacherSummary[] }>("/dashboard/teachers").then((r) => r.data.data),
  });

  const createClassMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ data: ClassSummary }>("/classes", {
        name: name.trim(),
        academicYear,
        teacherId,
      });
      return res.data.data;
    },
    onSuccess: () => {
      toast(`Class created`);
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["school"] });
      setName("");
      setTeacherId("");
    },
    onError: (err) => toast(extractError(err), "error"),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createClassMutation.mutate();
  };

  if (schoolQuery.isLoading || classesQuery.isLoading || teachersQuery.isLoading) {
    return (
      <div>
        <div className="grid gap-4 sm:grid-cols-3">
          <SkeletonGrid count={3} />
        </div>
        <div className="mt-6">
          <CardSkeleton lines={5} />
        </div>
      </div>
    );
  }

  if (schoolQuery.isError || !schoolQuery.data) {
    return <ErrorState onRetry={() => schoolQuery.refetch()} />;
  }

  const school = schoolQuery.data;
  const classes = classesQuery.data ?? [];
  const teachers = teachersQuery.data ?? [];

  return (
    <div>
      <div>
        <PillBadge>Admin overview</PillBadge>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink">{school.name}</h1>
        <p className="mt-1 text-sm text-muted">Manage classes, teachers, rosters, and handover cycles.</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatBadge value={String(school._count?.students ?? 0)} label="Students" />
        <StatBadge value={String(school._count?.classes ?? 0)} label="Classes" />
        <StatBadge value={String(school._count?.users ?? 0)} label="Staff members" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-card border border-border-soft bg-card p-6 shadow-soft lg:p-8">
          <h2 className="text-lg font-bold text-ink">Create a class</h2>
          <p className="mt-1 text-sm text-muted">Set up a class and assign its teacher for the year.</p>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor="className">
                Class name
              </label>
              <input
                id="className"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Year 5 Alpha"
                className="w-full rounded-xl border border-border-soft bg-canvas px-4 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor="academicYear">
                  Academic year
                </label>
                <input
                  id="academicYear"
                  required
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full rounded-xl border border-border-soft bg-canvas px-4 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor="teacherId">
                  Teacher
                </label>
                <select
                  id="teacherId"
                  required
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full rounded-xl border border-border-soft bg-canvas px-4 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
                >
                  <option value="" disabled>
                    Choose…
                  </option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={createClassMutation.isPending}
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary-dark disabled:opacity-60"
            >
              {createClassMutation.isPending ? "Creating…" : "Create class"}
            </button>
          </form>
        </div>

        <div className="rounded-card border border-border-soft bg-card p-6 shadow-soft lg:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Classes</h2>
            <Link to="/admin/roster" className="text-sm font-semibold text-primary hover:underline">
              Manage roster →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {classes.length === 0 && <p className="text-sm text-muted">No classes yet.</p>}
            {classes.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-border-soft bg-canvas px-4 py-3"
              >
                <div>
                  <p className="text-sm font-bold text-ink">{c.name}</p>
                  <p className="text-xs text-muted">
                    {c.academicYear} · {c.teacher?.firstName} {c.teacher?.lastName}
                  </p>
                </div>
                <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-bold text-primary">
                  {c._count?.students ?? 0} students
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-card border border-border-soft bg-card p-6 shadow-soft lg:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-ink">Teachers</h2>
            <p className="mt-1 text-sm text-muted">
              Invite staff by email. Each teacher activates their own password from a secure link.
            </p>
          </div>
          <Link
            to="/admin/teachers"
            className="shrink-0 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white transition hover:bg-primary-dark"
          >
            Manage teachers
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {teachers.map((t) => (
            <span
              key={t.id}
              className="rounded-full border border-border-soft bg-canvas px-4 py-1.5 text-sm font-semibold text-ink"
            >
              {t.firstName} {t.lastName}
            </span>
          ))}
          {teachers.length === 0 && <p className="text-sm text-muted">No teachers yet.</p>}
        </div>
      </div>
    </div>
  );
}
