interface FloatingOrbProps {
  className?: string;
  color?: string;
  size?: string;
}

export function FloatingOrb({ className = "", color = "bg-primary/25", size = "h-72 w-72" }: FloatingOrbProps) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute rounded-full blur-3xl ${size} ${color} animate-drift ${className}`}
    />
  );
}

interface SparkleProps {
  className?: string;
  delay?: number;
}

export function Sparkle({ className = "", delay = 0 }: SparkleProps) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute select-none text-primary animate-twinkle ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      ✦
    </span>
  );
}

export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div aria-hidden className="relative overflow-hidden border-y border-border-soft/70 bg-card/50 py-4 backdrop-blur">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-canvas to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-canvas to-transparent" />
      <div className="flex w-max animate-marquee">
        {row.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-2 whitespace-nowrap px-6 text-sm font-semibold text-muted"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
