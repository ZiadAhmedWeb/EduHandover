import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { extractError } from "../api/client";
import { homePath } from "../lib/roles";
import { Logo } from "../components/Layout";
import ThemeToggle from "../components/ThemeToggle";
import { FloatingOrb, Sparkle } from "../components/Decorations";

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@eduhandover.demo", password: "Admin123!" },
  { label: "Platform admin (reviews demo requests)", email: "platform@eduhandover.demo", password: "Platform123!" },
  { label: "Teacher �� Amy Harding (creates handovers)", email: "amy.harding@eduhandover.demo", password: "Teacher123!" },
  { label: "Teacher �� James Chen", email: "james.chen@eduhandover.demo", password: "Teacher123!" },
  { label: "New teacher �� Nina Alvarado (under 6 months)", email: "nina.alvarado@eduhandover.demo", password: "Teacher123!" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(email, password);
      const home = homePath(user.role);
      navigate(from ?? home, { replace: true });
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <FloatingOrb className="-left-28 -top-24" color="bg-primary/20" size="h-80 w-80" />
      <FloatingOrb className="-right-28 bottom-0" color="bg-accent/15" size="h-96 w-96" />
      <Sparkle className="left-[15%] top-24 text-2xl" delay={0} />
      <Sparkle className="right-[18%] top-1/3 text-lg" delay={900} />
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>
      <Logo />
      <div className="mt-6 w-full max-w-md animate-fade-in-scale rounded-card border border-border-soft bg-card p-8 shadow-soft">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Sign in to your school workspace.</p>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border-soft bg-canvas px-4 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
              placeholder="you@school.edu"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border-soft bg-canvas px-4 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          First time here? Your school administrator sends an{" "}
          <span className="font-semibold text-ink">invitation link</span> to set up your password.
        </p>
      </div>

      <div className="mt-6 w-full max-w-md animate-fade-in-scale rounded-card border border-dashed border-border-soft bg-card/60 p-5" style={{ animationDelay: "120ms" }}>
        <p className="text-center text-xs font-bold uppercase tracking-wide text-muted">Demo accounts</p>
        <div className="mt-3 space-y-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              onClick={() => {
                setEmail(acc.email);
                setPassword(acc.password);
                setError(null);
              }}
              className="flex w-full items-center justify-between rounded-xl border border-border-soft bg-canvas px-4 py-2 text-left text-sm transition hover:border-primary"
            >
              <span className="font-semibold text-ink">{acc.label}</span>
              <span className="text-xs text-muted">tap to fill</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
