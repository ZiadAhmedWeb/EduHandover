import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, extractError } from "../api/client";
import type { ClassSummary, StudentSummary } from "../api/types";
import { useToast } from "../context/ToastContext";
import { PillBadge } from "../components/StatBadge";
import { CardSkeleton } from "../components/LoadingSkeleton";
import { ErrorState } from "../components/ErrorState";
import { StatusChip, handoverStatusKind } from "../components/StatusChip";

export default function RosterPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [classId, setClassId] = useState("");

  const classesQuery = useQuery({
    queryKey: ["classes"],
    queryFn: () => api.get<{ data: ClassSummary[] }>("/classes").then((r) => r.data.data),
  });

  const studentsQuery = useQuery({
    queryKey: ["all-students"],
    queryFn: () => api.get<{ data: StudentSummary[] }>("/dashboard/students").then((r) => r.data.data),
  });

  const addStudentMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ data: StudentSummary }>("/students", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gradeLevel: gradeLevel.trim(),
        classId,
      });
      return res.data.data;
    },
    onSuccess: () => {
      toast(`${firstName} ${lastName} added to the roster`);
      queryClient.invalidateQueries({ queryKey: ["all-students"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["school"] });
      setFirstName("");
      setLastName("");
      setGradeLevel("");
      setClassId("");
    },
    onError: (err) => toast(extractError(err), "error"),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    addStudentMutation.mutate();
  };

  const filtered = useMemo(() => {
    const list = studentsQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((s) => `${s.firstName} ${s.lastName} ${s.gradeLevel}`.toLowerCase().includes(q));
  }, [studentsQuery.data, search]);

  if (classesQuery.isLoading || studentsQuery.isLoading) {
    return (
      <div>
        <CardSkeleton lines={6} />
      </div>
    );
  }

  if (studentsQuery.isError) {
    return <ErrorState onRetry={() => studentsQuery.refetch()} />;
  }

  const classes = classesQuery.data ?? [];
  const inputClass =
    "w-full rounded-xl border border-border-soft bg-canvas px-4 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light";

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <PillBadge>Roster management</PillBadge>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink">Students</h1>
          <p className="mt-1 text-sm text-muted">Add students to classes and watch their handover status.</p>
        </div>
        <div className="w-full sm:w-72">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roster…"
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-card border border-border-soft bg-card p-6 shadow-soft lg:col-span-1">
          <h2 className="text-lg font-bold text-ink">Add a student</h2>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor="sFirstName">
                  First name
                </label>
                <input
                  id="sFirstName"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputClass}
                  placeholder="Maya"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor="sLastName">
                  Last name
                </label>
                <input
                  id="sLastName"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputClass}
                  placeholder="Thompson"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor="gradeLevel">
                Grade level
              </label>
              <input
                id="gradeLevel"
                required
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className={inputClass}
                placeholder="Year 5"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor="sClassId">
                Class
              </label>
              <select
                id="sClassId"
                required
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className={inputClass}
              >
                <option value="" disabled>
                  Choose a class…
                </option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.academicYear}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={addStudentMutation.isPending}
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary-dark disabled:opacity-60"
            >
              {addStudentMutation.isPending ? "Adding…" : "Add student"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-card border border-border-soft bg-card shadow-soft">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border-soft bg-canvas text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3 font-bold">Student</th>
                  <th className="px-5 py-3 font-bold">Grade</th>
                  <th className="hidden px-5 py-3 font-bold md:table-cell">Class</th>
                  <th className="px-5 py-3 font-bold">Handover</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-muted">
                      No students match your search.
                    </td>
                  </tr>
                )}
                {filtered.map((s) => (
                  <tr key={s.id} className="transition hover:bg-canvas/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-light text-xs font-extrabold text-primary">
                          {s.firstName[0]}
                          {s.lastName[0]}
                        </span>
                        <span className="font-semibold text-ink">
                          {s.firstName} {s.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted">{s.gradeLevel}</td>
                    <td className="hidden px-5 py-3 text-muted md:table-cell">
                      {s.currentClass?.name ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <StatusChip status={handoverStatusKind(s.handover)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
