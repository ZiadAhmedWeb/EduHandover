import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, extractError } from "../api/client";
import type { HandoverProfile, StudentSummary, TagGroups } from "../api/types";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { WizardStepper } from "../components/WizardStepper";
import { TagPill } from "../components/TagPill";
import { LoadingSkeleton, CardSkeleton } from "../components/LoadingSkeleton";
import { ErrorState } from "../components/ErrorState";
import { StatusChip, handoverStatusKind } from "../components/StatusChip";

function currentAcademicYear(): string {
  const now = new Date();
  const start = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}-${start + 1}`;
}

type CategoryKey = "learningStyles" | "focusTriggers" | "behavioralTags";

const TAGS_GROUP_KEY: Record<CategoryKey, keyof TagGroups> = {
  learningStyles: "learningStyles",
  focusTriggers: "focusTriggers",
  behavioralTags: "behavioralStrengths",
};

const CATEGORY_META: Record<CategoryKey, { title: string; hint: string }> = {
  learningStyles: {
    title: "How does this student learn best?",
    hint: "Pick up to 5 learning styles that fit. These power the next teacher's first day.",
  },
  focusTriggers: {
    title: "What keeps them focused (or breaks focus)?",
    hint: "Pick up to 5 focus triggers and behavioral strengths.",
  },
  behavioralTags: {
    title: "What are their behavioral strengths?",
    hint: "Pick up to 5 strengths — this is the good stuff the next teacher should know.",
  },
};

export default function HandoverWizard() {
  const { studentId = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const academicYear = currentAcademicYear();

  const [step, setStep] = useState(1);
  const [learningStyles, setLearningStyles] = useState<string[]>([]);
  const [focusTriggers, setFocusTriggers] = useState<string[]>([]);
  const [behavioralTags, setBehavioralTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [initialized, setInitialized] = useState(false);

  const studentQuery = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => api.get<{ data: StudentSummary }>(`/students/${studentId}`).then((r) => r.data.data),
  });

  const existingQuery = useQuery({
    queryKey: ["my-handover", studentId],
    queryFn: () =>
      api.get<{ data: HandoverProfile | null }>(`/handovers/mine/student/${studentId}`).then((r) => r.data.data),
  });

  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: () => api.get<{ data: TagGroups }>("/tags").then((r) => r.data.data),
  });

  const existing = existingQuery.data;
  const alreadySubmitted = existing && existing.status === "SUBMITTED";

  useEffect(() => {
    if (existingQuery.isSuccess && !initialized) {
      if (existing && existing.status !== "SUBMITTED") {
        setLearningStyles(existing.learningStyles);
        setFocusTriggers(existing.focusTriggers);
        setBehavioralTags(existing.behavioralTags);
        setNotes(existing.notes ?? "");
      }
      setInitialized(true);
    }
  }, [existingQuery.isSuccess, existing, initialized]);

  const toggle = (key: CategoryKey, slug: string) => {
    const setter = key === "learningStyles" ? setLearningStyles : key === "focusTriggers" ? setFocusTriggers : setBehavioralTags;
    const current = key === "learningStyles" ? learningStyles : key === "focusTriggers" ? focusTriggers : behavioralTags;
    setter(current.includes(slug) ? current.filter((s) => s !== slug) : current.length < 5 ? [...current, slug] : current);
  };

  const stepValid = (s: number) => {
    if (s === 1) return learningStyles.length > 0;
    if (s === 2) return focusTriggers.length > 0 && behavioralTags.length > 0;
    return true;
  };

  const payload = () => ({
    studentId,
    academicYear,
    learningStyles,
    focusTriggers,
    behavioralTags,
    notes: notes.trim() || undefined,
  });

  const saveMutation = useMutation({
    mutationFn: async (mode: "DRAFT" | "SUBMITTED") => {
      const body = { ...payload(), status: mode };
      if (existing && existing.status === "DRAFT") {
        const res = await api.put<{ data: HandoverProfile }>(`/handovers/${existing.id}`, body);
        return res.data.data;
      }
      const res = await api.post<{ data: HandoverProfile }>("/handovers", body);
      return res.data.data;
    },
    onSuccess: (profile, mode) => {
      queryClient.invalidateQueries({ queryKey: ["my-handover", studentId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-students"] });
      if (mode === "DRAFT") {
        toast("Draft saved — you can come back anytime.", "info");
      } else {
        toast(`Handover for ${profile.student.firstName} submitted!`);
        navigate(`/students/${studentId}`);
      }
    },
    onError: (err) => {
      toast(extractError(err), "error");
    },
  });

  const hasHandoverAccess = user?.role === "ADMIN" || user?.canCreateHandovers === true;

  if (!hasHandoverAccess) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-card border border-border-soft bg-card p-8 text-center shadow-soft">
          <p className="text-4xl">🔒</p>
          <h1 className="mt-4 text-2xl font-extrabold text-ink">
            Handover access unlocks after 6 months
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            New teachers can review and acknowledge handovers right away. Creating handovers for
            students becomes available once you've been at the school for 6 months.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white transition hover:bg-primary-dark"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (studentQuery.isLoading || existingQuery.isLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <CardSkeleton lines={8} />
      </div>
    );
  }

  if (studentQuery.isError || !studentQuery.data) {
    return <ErrorState message="We couldn't find this student." />;
  }

  const student = studentQuery.data;

  if (alreadySubmitted) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-card border border-border-soft bg-card p-8 text-center shadow-soft">
          <p className="text-4xl">🎉</p>
          <h1 className="mt-4 text-2xl font-extrabold text-ink">
            {student.firstName}'s handover is already submitted
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Submitted profiles can't be edited. View the profile below or start a fresh handover next year.
          </p>
          <div className="mt-6 flex justify-center">
            <StatusChip status={handoverStatusKind(existing!)} />
          </div>
          <Link
            to={`/students/${studentId}`}
            className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white transition hover:bg-primary-dark"
          >
            View profile
          </Link>
        </div>
      </div>
    );
  }

  if (!initialized || tagsQuery.isLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <LoadingSkeleton />
      </div>
    );
  }

  const tags = tagsQuery.data;
  if (!tags) {
    return <ErrorState message="Couldn't load the preset tags." />;
  }

  const selectedCount = learningStyles.length + focusTriggers.length + behavioralTags.length;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">
            {student.firstName} {student.lastName} · {student.gradeLevel}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink">
            {step === 3 ? "Notes & review" : CATEGORY_META[step === 1 ? "learningStyles" : "focusTriggers"].title}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Academic year {academicYear} · takes about 3 minutes
          </p>
        </div>
        <span className="hidden rounded-full bg-primary-light px-3 py-1 text-xs font-bold text-primary sm:block">
          {selectedCount} tags
        </span>
      </div>

      <div className="mt-6">
        <WizardStepper step={step} />
      </div>

      <div className="mt-8 rounded-card border border-border-soft bg-card p-6 shadow-soft lg:p-8">
        {step === 1 && (
          <section>
            <h2 className="text-lg font-bold text-ink">{CATEGORY_META.learningStyles.title}</h2>
            <p className="mt-1 text-sm text-muted">{CATEGORY_META.learningStyles.hint}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {tags.learningStyles.map((t) => (
                <TagPill
                  key={t.slug}
                  label={t.label}
                  category="learningStyles"
                  selected={learningStyles.includes(t.slug)}
                  onClick={() => toggle("learningStyles", t.slug)}
                />
              ))}
            </div>
            {learningStyles.length === 0 && (
              <p className="mt-4 text-xs font-medium text-amber-600 dark:text-amber-400">Select at least one to continue.</p>
            )}
          </section>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-bold text-ink">{CATEGORY_META.focusTriggers.title}</h2>
              <p className="mt-1 text-sm text-muted">{CATEGORY_META.focusTriggers.hint}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {tags.focusTriggers.map((t) => (
                  <TagPill
                    key={t.slug}
                    label={t.label}
                    category="focusTriggers"
                    selected={focusTriggers.includes(t.slug)}
                    onClick={() => toggle("focusTriggers", t.slug)}
                  />
                ))}
              </div>
            </section>
            <section>
              <h2 className="text-lg font-bold text-ink">{CATEGORY_META.behavioralTags.title}</h2>
              <p className="mt-1 text-sm text-muted">{CATEGORY_META.behavioralTags.hint}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {tags.behavioralStrengths.map((t) => (
                  <TagPill
                    key={t.slug}
                    label={t.label}
                    category="behavioralTags"
                    selected={behavioralTags.includes(t.slug)}
                    onClick={() => toggle("behavioralTags", t.slug)}
                  />
                ))}
              </div>
            </section>
            {(focusTriggers.length === 0 || behavioralTags.length === 0) && (
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                Pick at least one focus trigger and one strength to continue.
              </p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <section>
              <h2 className="text-lg font-bold text-ink">Anything else the next teacher should know?</h2>
              <p className="mt-1 text-sm text-muted">Optional · up to 500 characters. Encrypted before storing.</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                rows={5}
                placeholder="e.g. Maya stays focused with short written steps and a visual timer; she asks for a quiet corner when the class gets loud."
                className="mt-4 w-full rounded-xl border border-border-soft bg-canvas px-4 py-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
              />
              <p className="mt-1 text-right text-xs text-muted">{notes.length}/500</p>
              <div className="mt-2 rounded-xl border border-primary-light/40 bg-primary-light/10 px-4 py-3">
                <p className="text-xs leading-relaxed text-ink">
                  <span className="font-bold">Please keep this note kind and professional.</span> A toddler reads (or hears)
                  these words later — avoid anything rude, harsh, or judgmental. Focus on how to help the child, so their
                  handover feels supportive, never hurtful.
                </p>
              </div>
            </section>

            <section className="rounded-2xl bg-canvas p-5">
              <h3 className="text-sm font-bold text-ink">Review summary</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {(
                  [
                    ["Learning styles", learningStyles, "learningStyles"],
                    ["Focus triggers", focusTriggers, "focusTriggers"],
                    ["Strengths", behavioralTags, "behavioralTags"],
                  ] as const
                ).map(([label, slugs, category]) => (
                  <div key={label}>
                    <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {slugs.length === 0 && <span className="text-xs text-slate-400 dark:text-slate-500">None</span>}
                      {slugs.map((slug) => {
                        const group = tags[TAGS_GROUP_KEY[category]];
                        const meta = group.find((t) => t.slug === slug);
                        return <TagPill key={slug} label={meta?.label ?? slug} category={category} />;
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {notes.trim() && (
                <div className="mt-5 border-t border-border-soft pt-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">Notes</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">{notes}</p>
                </div>
              )}
            </section>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="rounded-full border border-border-soft px-6 py-2.5 text-sm font-semibold text-muted transition hover:text-ink"
            >
              Back
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => saveMutation.mutate("DRAFT")}
              disabled={saveMutation.isPending}
              className="rounded-full border border-border-soft px-5 py-2.5 text-sm font-semibold text-muted transition hover:border-primary hover:text-primary disabled:opacity-50"
            >
              {saveMutation.isPending ? "Saving…" : "Save draft"}
            </button>

            {step < 3 ? (
              <button
                onClick={() => {
                  if (stepValid(step)) setStep(step + 1);
                }}
                disabled={!stepValid(step)}
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white transition hover:bg-primary-dark disabled:opacity-40"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={() => saveMutation.mutate("SUBMITTED")}
                disabled={!stepValid(2) || saveMutation.isPending}
                className="rounded-full bg-cta px-6 py-2.5 text-sm font-bold text-ink transition hover:bg-cta-dark disabled:opacity-40"
              >
                {saveMutation.isPending ? "Submitting…" : "Submit handover"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
