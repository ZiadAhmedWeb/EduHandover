import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { homePath } from "../lib/roles";
import ThemeToggle from "./ThemeToggle";

function Logo({ light = false }: { light?: boolean }) {
  const { user } = useAuth();
  const to = user ? homePath(user.role) : "/";
  return (
    <Link to={to} className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-lg font-extrabold text-white shadow-soft">
        E
      </span>
      <span className={`text-lg font-extrabold tracking-tight ${light ? "text-white" : "text-ink"}`}>
        Edu<span className="text-primary">Handover</span>
      </span>
    </Link>
  );
}

function NavLinkItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-full px-4 py-2 text-sm font-semibold transition ${
          isActive ? "bg-primary-light text-primary" : "text-muted hover:text-ink"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    setMobileOpen(false);
    logout();
    navigate("/");
  };

  const closeMobile = () => setMobileOpen(false);

  const navItems = (() => {
    switch (user?.role) {
      case "ADMIN":
        return [
          { to: "/admin", label: "Overview" },
          { to: "/admin/teachers", label: "Teachers" },
          { to: "/admin/roster", label: "Roster" },
        ];
      case "TEACHER":
        return [{ to: "/dashboard", label: "My Dashboard" }];
      case "PLATFORM_ADMIN":
        return [{ to: "/platform", label: "Demo requests" }];
      default:
        return [];
    }
  })();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border-soft/70 bg-card/80 backdrop-blur">
        <div className="h-0.5 bg-gradient-to-r from-primary via-fuchsia-500 to-accent" />
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLinkItem key={item.to} to={item.to}>
                {item.label}
              </NavLinkItem>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden text-right lg:block">
              <p className="text-sm font-semibold leading-tight text-ink">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted">
                {user?.role === "PLATFORM_ADMIN" ? "Platform" : user?.school?.name}
              </p>
            </div>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="hidden rounded-full border border-border-soft bg-card px-4 py-2 text-sm font-semibold text-muted transition hover:border-primary hover:text-primary sm:block"
            >
              Sign out
            </button>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border-soft bg-card text-muted transition hover:border-primary hover:text-primary md:hidden"
            >
              {mobileOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-border-soft/70 bg-card px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      isActive ? "bg-primary-light text-primary" : "text-muted hover:bg-canvas hover:text-ink"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <button
                onClick={handleLogout}
                className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 sm:hidden"
              >
                Sign out
              </button>
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-border-soft/70 py-6">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-muted sm:px-6">
          EduHandover · Bridge every classroom transition
        </div>
        <div className="mt-2 text-center text-xs text-muted">
          Made by Saja Waleed · Ziad Ahmed · Younes Mohamed · Mohamed Elghobashy
        </div>
      </footer>
    </div>
  );
}

export { Logo };
