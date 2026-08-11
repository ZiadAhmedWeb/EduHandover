const STEP_LABELS = ["Learning style", "Focus & strengths", "Notes & review"];

export function WizardStepper({ step }: { step: number }) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <div key={label} className="flex flex-1 flex-col items-start gap-1.5">
              <div className="flex w-full items-center gap-2">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                    done
                      ? "bg-accent text-white"
                      : active
                        ? "bg-primary text-white"
                        : "bg-slate-200 text-slate-500 dark:bg-slate-500/20 dark:text-slate-400"
                  }`}
                >
                  {done ? "✓" : n}
                </div>
                {n < STEP_LABELS.length && (
                  <div className={`h-1 flex-1 rounded-full ${done ? "bg-accent" : "bg-slate-200 dark:bg-slate-500/20"}`} />
                )}
              </div>
              <span
                className={`text-[11px] font-semibold ${
                  active || done ? "text-ink" : "text-muted"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
