import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { extractError } from "../api/client";
import { homePath } from "../lib/roles";
import { Logo } from "../components/Layout";
import ThemeToggle from "../components/ThemeToggle";
import { FloatingOrb, Sparkle } from "../components/Decorations";

export default function ActivatePage() {
  const { activate } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const user = await activate(token, password);
      const home = homePath(user.role);
      navigate(home, { replace: true });
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-border-soft bg-canvas px-4 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <FloatingOrb className="-left-28 -top-24" color="bg-primary/20" size="h-80 w-80" />
      <FloatingOrb className="-right-28 bottom-0" color="bg-fuchsia-400/15" size="h-96 w-96" />
      <Sparkle className="left-[18%] top-1/4 text-2xl" delay={400} />
      <Sparkle className="right-[16%] top-1/2 text-lg" delay={1200} />
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>
      <Logo />
      <div className="mt-6 w-full max-w-md animate-fade-in-scale rounded-card border border-border-soft bg-card p-8 shadow-soft">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Set up your password</h1>
        <p className="mt-1 text-sm text-muted">
          Your school administrator invited you to EduHandover. Choose a password to activate your account.
        </p>

        {!token && (
          <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">
            This link is missing an activation token. Ask your school administrator to resend your invitation.
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}

        {token && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor="password">
                New password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor="confirmPassword">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary-dark disabled:opacity-60"
            >
              {submitting ? "Activating..." : "Activate account"}
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
