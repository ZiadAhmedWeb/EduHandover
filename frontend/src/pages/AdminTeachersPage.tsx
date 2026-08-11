import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, extractError } from "../api/client";
import type { TeacherInviteResult, TeacherSummary } from "../api/types";
import { useToast } from "../context/ToastContext";
import { PillBadge } from "../components/StatBadge";
import { CardSkeleton } from "../components/LoadingSkeleton";
import { ErrorState } from "../components/ErrorState";

interface InviteOutcome {
  ok: boolean;
  email: string;
  message: string;
  activationLink?: string;
  classCreated?: boolean;
}

const inputClass =
  "w-full rounded-xl border border-border-soft bg-canvas px-4 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light";

const labelClass = "mb-1.5 block text-sm font-semibold text-ink";

function parseCsv(text: string): Array<{ firstName: string; lastName: string; email: string; className?: string }> {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      return {
        firstName: parts[0] ?? "",
        lastName: parts[1] ?? "",
        email: parts[2] ?? "",
        className: parts[3]?.trim() || undefined,
      };
    })
    .filter((row) => row.email);
}

export default function AdminTeachersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [className, setClassName] = useState("");

  const [csvText, setCsvText] = useState("");
  const [outcomes, setOutcomes] = useState<InviteOutcome[]>([]);

  const teachersQuery = useQuery({
    queryKey: ["teachers"],
    queryFn: () => api.get<{ data: TeacherSummary[] }>("/dashboard/teachers").then((r) => r.data.data),
  });

  const inviteMutation = useMutation({
    mutationFn: async (input: { firstName: string; lastName: string; email: string; className?: string }) => {
      const res = await api.post<{ data: TeacherInviteResult }>("/admin/teachers/invite", input);
      return res.data.data;
    },
    onSuccess: (teacher) => {
      setOutcomes((prev) => [
        {
          ok: true,
          email: teacher.email,
          message: "Invitation sent",
          activationLink: teacher.activationLink,
          classCreated: teacher.classCreated,
        },
        ...prev,
      ]);
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      setFirstName("");
      setLastName("");
      setEmail("");
      setClassName("");
    },
    onError: (err, vars) => {
      setOutcomes((prev) => [
        { ok: false, email: vars.email, message: extractError(err) },
        ...prev,
      ]);
    },
  });

  const handleInvite = (e: FormEvent) => {
    e.preventDefault();
    inviteMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      className: className.trim() || undefined,
    });
  };

  const handleCsvImport = async () => {
    const rows = parseCsv(csvText);
    if (rows.length === 0) {
      toast("No rows found. Use First, Last, email, Class per line.", "error");
      return;
    }
    const results = await Promise.allSettled(
      rows.map((row) =>
        api.post<{ data: TeacherInviteResult }>("/admin/teachers/invite", {
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          className: row.className,
        })
      )
    );
    const newOutcomes = results.map((res, i) => {
      const row = rows[i];
      if (res.status === "fulfilled") {
        const t = res.value.data.data;
        return {
          ok: true,
          email: t.email,
          message: "Invitation sent",
          activationLink: t.activationLink,
          classCreated: t.classCreated,
        } as InviteOutcome;
      }
      return {
        ok: false,
        email: row.email,
        message: extractError(res.reason),
      } as InviteOutcome;
    });
    setOutcomes((prev) => [...newOutcomes, ...prev]);
    setCsvText("");
    queryClient.invalidateQueries({ queryKey: ["teachers"] });
  };

  if (teachersQuery.isLoading) {
    return <CardSkeleton lines={5} />;
  }

  if (teachersQuery.isError) {
    return <ErrorState onRetry={() => teachersQuery.refetch()} />;
  }

  const teachers = teachersQuery.data ?? [];

  return (
    <div>
      <div>
        <PillBadge>Admin</PillBadge>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink">Teachers</h1>
        <p className="mt-1 text-sm text-muted">
          Invite teachers to your school. Each invitation includes a secure activation link they can use to set
          their own password — no shared passwords needed.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-card border border-border-soft bg-card p-6 shadow-soft lg:p-8">
          <h2 className="text-lg font-bold text-ink">Invite a teacher</h2>
          <p className="mt-1 text-sm text-muted">
            They'll receive an activation link valid for 72 hours. Optionally assign an existing class name.
          </p>
          <form onSubmit={handleInvite} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="inviteFirstName">
                  First name
                </label>
                <input
                  id="inviteFirstName"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jamie"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="inviteLastName">
                  Last name
                </label>
                <input
                  id="inviteLastName"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Rivera"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="inviteEmail">
                Email
              </label>
              <input
                id="inviteEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="j.rivera@school.edu"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="inviteClass">
                Assigned class <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id="inviteClass"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Year 5 Alpha"
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={inviteMutation.isPending}
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary-dark disabled:opacity-60"
            >
              {inviteMutation.isPending ? "Sending..." : "Send invitation"}
            </button>
          </form>
        </div>

        <div className="rounded-card border border-border-soft bg-card p-6 shadow-soft lg:p-8">
          <h2 className="text-lg font-bold text-ink">Import a list</h2>
          <p className="mt-1 text-sm text-muted">
            Paste one teacher per line as <span className="font-mono text-xs text-ink">First, Last, email, Class</span>.
            The class is optional.
          </p>
          <textarea
            rows={6}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={"Jamie, Rivera, j.rivera@school.edu, Year 5 Alpha\nMorgan, Lee, m.lee@school.edu"}
            className={`${inputClass} mt-4 font-mono text-xs`}
          />
          <button
            onClick={handleCsvImport}
            disabled={!csvText.trim()}
            className="mt-4 w-full rounded-xl border border-primary bg-primary-light py-3 text-sm font-bold text-primary transition hover:bg-primary hover:text-white disabled:opacity-50"
          >
            Import {parseCsv(csvText).length > 0 ? `${parseCsv(csvText).length} teachers` : "teachers"}
          </button>
        </div>
      </div>

      {outcomes.length > 0 && (
        <div className="mt-6 rounded-card border border-border-soft bg-card p-6 shadow-soft lg:p-8">
          <h2 className="text-lg font-bold text-ink">Recent invitations</h2>
          <div className="mt-4 space-y-3">
            {outcomes.map((o, idx) => (
              <div
                key={`${o.email}-${idx}`}
                className={`rounded-xl border px-4 py-3 ${
                  o.ok ? "border-border-soft bg-canvas" : "border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`text-sm font-bold ${o.ok ? "text-ink" : "text-red-600 dark:text-red-300"}`}>
                      {o.ok ? "✓ " : "✕ "}
                      {o.email}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{o.message}</p>
                    {o.classCreated && (
                      <p className="mt-0.5 text-xs font-semibold text-primary">Class created for this teacher</p>
                    )}
                  </div>
                  {o.activationLink && (
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(o.activationLink ?? "");
                        toast("Activation link copied");
                      }}
                      className="shrink-0 rounded-full border border-primary bg-primary-light px-4 py-1.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-white"
                    >
                      Copy link
                    </button>
                  )}
                </div>
                {o.activationLink && (
                  <p className="mt-2 break-all rounded-lg bg-canvas px-3 py-2 font-mono text-[11px] text-muted">
                    {o.activationLink}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 rounded-card border border-border-soft bg-card p-6 shadow-soft lg:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Current staff</h2>
          <Link to="/admin/roster" className="text-sm font-semibold text-primary hover:underline">
            Manage roster →
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {teachers.length === 0 && <p className="text-sm text-muted">No teachers yet.</p>}
          {teachers.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-xl border border-border-soft bg-canvas px-4 py-3"
            >
              <div>
                <p className="text-sm font-bold text-ink">
                  {t.firstName} {t.lastName}
                </p>
                <p className="text-xs text-muted">{t.email}</p>
              </div>
              <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-bold text-primary">TEACHER</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
