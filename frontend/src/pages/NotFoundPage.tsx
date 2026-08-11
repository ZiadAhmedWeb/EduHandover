import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-extrabold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-extrabold text-ink">Page not found</h1>
      <p className="mt-2 text-sm text-muted">The page you're looking for doesn't exist.</p>
      <Link
        to="/"
        className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
      >
        Back home
      </Link>
    </div>
  );
}
