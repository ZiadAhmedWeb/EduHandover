const CATEGORY_STYLES: Record<string, { className: string; dot: string }> = {
  learningStyles: { className: "bg-primary-light text-primary", dot: "bg-primary" },
  focusTriggers: { className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300", dot: "bg-amber-500" },
  behavioralTags: { className: "bg-accent-light text-green-700 dark:bg-emerald-500/15 dark:text-emerald-300", dot: "bg-accent" },
};

interface TagPillProps {
  label: string;
  slug?: string;
  category?: "learningStyles" | "focusTriggers" | "behavioralTags";
  selected?: boolean;
  onClick?: () => void;
}

export function TagPill({ label, category = "learningStyles", selected, onClick }: TagPillProps) {
  const style = CATEGORY_STYLES[category];
  const Comp = onClick ? "button" : "span";

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        onClick ? "cursor-pointer" : ""
      } ${selected ? "ring-2 ring-primary ring-offset-1 " + style.className : style.className}`}
    >
      {onClick && <span className={`h-2 w-2 rounded-full ${selected ? style.dot : "bg-slate-300 dark:bg-slate-600"}`} />}
      {label}
      {onClick && (
        <span className="ml-0.5 text-[10px] opacity-70">{selected ? "✓" : "+"}</span>
      )}
    </Comp>
  );
}
