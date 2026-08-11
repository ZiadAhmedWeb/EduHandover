import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PillBadge, StatBadge } from "../components/StatBadge";
import { FAQAccordion } from "../components/FAQAccordion";
import BookDemoModal from "../components/BookDemoModal";
import ThemeToggle from "../components/ThemeToggle";
import Reveal from "../components/Reveal";
import { FloatingOrb, Sparkle, Marquee } from "../components/Decorations";
import { useAuth } from "../context/AuthContext";
import { homePath } from "../lib/roles";

function StepCard({ number, title, body, icon }: { number: string; title: string; body: string; icon: string }) {
  return (
    <div className="group relative h-full rounded-card border border-border-soft bg-card p-6 shadow-soft transition duration-300 hover:-translate-y-1.5 hover:shadow-lift lg:p-8">
      <div className="pointer-events-none absolute inset-0 rounded-card bg-gradient-to-br from-primary/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-2xl shadow-soft transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
          {icon}
        </span>
        <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">Step {number}</span>
      </div>
      <h3 className="relative mt-5 text-lg font-bold text-ink">{title}</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}

function TeamCard({
  name,
  role,
  initials,
  gradient,
}: {
  name: string;
  role: string;
  initials: string;
  gradient: string;
}) {
  return (
    <div className="group relative h-full rounded-card border border-border-soft bg-card p-6 text-center shadow-soft transition duration-300 hover:-translate-y-1.5 hover:shadow-lift">
      <div className="pointer-events-none absolute inset-0 rounded-card bg-gradient-to-br from-primary/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div
        className={`relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-xl font-extrabold text-white shadow-soft transition-transform duration-300 group-hover:scale-110`}
      >
        {initials}
      </div>
      <h3 className="relative mt-4 text-base font-bold text-ink">{name}</h3>
      <p className="relative mt-1 text-xs font-semibold uppercase tracking-wide text-primary">{role}</p>
    </div>
  );
}

const TEAM = [
  { name: "Saja Waleed", role: "Co-founder & CEO", initials: "SW", gradient: "from-primary to-primary-dark" },
  { name: "Ziad Ahmed", role: "Co-founder & CEO", initials: "ZA", gradient: "from-accent to-fuchsia-700" },
  { name: "Younes Mohamed", role: "Co-founder & CEO", initials: "YM", gradient: "from-fuchsia-600 to-accent" },
  { name: "Mohamed Elghobashy", role: "Co-founder & CEO", initials: "ME", gradient: "from-primary-dark to-fuchsia-800" },
];

const FAQS = [
  {
    question: "Who creates the handover profile?",
    answer:
      "Teachers who have been at the school for 6+ months complete a structured 3-minute wizard per student. No free-form essays — just proven preset tags plus optional short notes, encrypted end-to-end.",
  },
  {
    question: "Who can see a student's profile?",
    answer:
      "Only the creating teacher, the teacher assigned to review it, and the school admin. Everyone else is denied, and notes are AES-256 encrypted at rest.",
  },
  {
    question: "Who reviews and acknowledges a handover?",
    answer:
      "A teacher within their first 6 months at the school opens each profile and taps 'Acknowledge'. EduHandover timestamps the acknowledgment and keeps an audit log of every receipt.",
  },
  {
    question: "How do teachers get access to the platform?",
    answer:
      "School administrators purchase access for their school and invite teachers by email. Each teacher activates their own account with a secure link — there's no public sign-up and no shared passwords.",
  },
  {
    question: "Is my student data private?",
    answer:
      "Yes. Handover notes are encrypted before they touch the database, we never log decrypted content, and data is scoped to your school only.",
  },
  {
    question: "What happens at the start of a new academic year?",
    answer:
      "Submitted profiles for the previous year can be archived, and new class assignments trigger a fresh handover cycle for the reviewing teacher.",
  },
];

const MARQUEE_ITEMS = [
  "3-minute guided wizard",
  "AES-256 encrypted notes",
  "One-tap acknowledge",
  "Tag-driven insights",
  "School-scoped privacy",
  "Day-1 ready handovers",
  "Audit-logged receipts",
];

export default function LandingPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [demoOpen, setDemoOpen] = useState(false);
  const appHome = user ? homePath(user.role) : "/";
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <header className="sticky top-0 z-40 border-b border-border-soft/70 bg-card/80 backdrop-blur">
        <div className="h-0.5 bg-gradient-to-r from-primary via-fuchsia-500 to-accent" />
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to={appHome} className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-lg font-extrabold text-white shadow-soft">
              E
            </span>
            <span className="text-lg font-extrabold tracking-tight text-ink">
              Edu<span className="text-primary">Handover</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  to={appHome}
                  className="rounded-full px-3 py-2 text-sm font-semibold text-muted transition hover:text-ink sm:px-4"
                >
                  Go to dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-full px-3 py-2 text-sm font-semibold text-muted transition hover:text-ink sm:px-4"
                >
                  Sign in
                </Link>
                <button
                  onClick={() => setDemoOpen(true)}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark sm:px-5"
                >
                  Book a demo
                </button>
              </>
            )}
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <FloatingOrb className="-left-24 -top-20" color="bg-primary/25" size="h-80 w-80" />
        <FloatingOrb className="-right-28 top-32" color="bg-fuchsia-400/20" size="h-96 w-96" />
        <FloatingOrb className="bottom-0 left-1/4" color="bg-accent/20" size="h-72 w-72" />
        <Sparkle className="left-[12%] top-24 text-2xl" delay={0} />
        <Sparkle className="right-[14%] top-40 text-lg" delay={700} />
        <Sparkle className="left-[22%] top-[68%] text-lg" delay={1400} />
        <Sparkle className="right-[24%] top-[72%] text-2xl" delay={2100} />

        <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
          <div className="animate-fade-in">
            <PillBadge>
              <span className="relative mr-2 inline-flex h-2 w-2">
                <span className="ping-soft absolute inline-flex h-2 w-2 rounded-full bg-primary" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Built for school transitions
            </PillBadge>
          </div>
          <h1
            className="mx-auto mt-6 max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-ink animate-fade-in sm:text-5xl lg:text-6xl"
            style={{ animationDelay: "100ms" }}
          >
            Where Student Insights{" "}
            <span className="text-gradient-animated">Never Get Left Behind.</span>
          </h1>
          <p
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted animate-fade-in sm:text-lg"
            style={{ animationDelay: "200ms" }}
          >
            EduHandover gives the next teacher everything they need to be Day-1 ready — structured learning
            styles, focus triggers, and strengths captured in a 3-minute guided wizard, stored securely and
            acknowledged with one tap.
          </p>
          <div
            className="mt-9 flex flex-wrap items-center justify-center gap-3 animate-fade-in"
            style={{ animationDelay: "300ms" }}
          >
            {user ? (
              <Link
                to={appHome}
                className="rounded-full bg-cta px-7 py-3 text-sm font-bold text-ink shadow-soft transition hover:-translate-y-0.5 hover:bg-cta-dark"
              >
                Start a handover
              </Link>
            ) : (
              <button
                onClick={() => setDemoOpen(true)}
                className="rounded-full bg-cta px-7 py-3 text-sm font-bold text-ink shadow-soft transition hover:-translate-y-0.5 hover:bg-cta-dark"
              >
                Book a demo
              </button>
            )}
            <Link
              to="/login"
              className="rounded-full border border-border-soft bg-card px-7 py-3 text-sm font-bold text-ink transition hover:border-primary hover:text-primary"
            >
              Sign in
            </Link>
          </div>
          <p
            className="mt-7 text-xs text-muted animate-fade-in"
            style={{ animationDelay: "400ms" }}
          >
            No credit card — used by districts, private and primary schools
          </p>

          {/* Floating objects */}
          <div className="relative mx-auto mt-16 hidden max-w-3xl md:block">
            <div
              className="absolute -left-16 top-0 animate-float rounded-2xl border border-border-soft bg-card px-4 py-3 shadow-lift"
              style={{ animationDelay: "0ms" }}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-sm">✓</span>
                <div className="text-left">
                  <p className="text-xs font-bold text-ink">Handover acknowledged</p>
                  <p className="text-[11px] text-muted">Maya → Nina · just now</p>
                </div>
              </div>
            </div>
            <div
              className="absolute -right-14 top-6 animate-float-slow rounded-2xl border border-border-soft bg-card px-4 py-3 shadow-lift"
              style={{ animationDelay: "600ms" }}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-light text-sm">✍️</span>
                <div className="text-left">
                  <p className="text-xs font-bold text-ink">3-minute wizard</p>
                  <p className="text-[11px] text-muted">Learning styles → tags → notes</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
              <div
                className="animate-float-reverse rounded-full border border-border-soft bg-card px-5 py-2.5 shadow-lift"
                style={{ animationDelay: "1200ms" }}
              >
                <p className="text-xs font-bold text-ink">
                  <span className="text-primary">100%</span> structured · <span className="text-primary">AES-256</span>{" "}
                  encrypted
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Marquee items={MARQUEE_ITEMS} />

      <section className="mx-auto max-w-4xl px-4 pb-16 pt-16 sm:px-6">
        <Reveal>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatBadge value="3 min" label="per handover" />
            <StatBadge value="100%" label="structured tags" />
            <StatBadge value="AES-256" label="encrypted notes" />
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <Reveal className="text-center">
          <PillBadge>How it works</PillBadge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Handoff — Store — <span className="text-gradient-animated">Dashboard</span>
          </h2>
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Reveal delay={0}>
            <StepCard
              number="1"
              icon="✍️"
              title="Handoff with the wizard"
              body="A teacher taps through preset pills — learning styles, focus triggers, strengths — plus a short optional note. No blank pages, no guesswork."
            />
          </Reveal>
          <Reveal delay={150}>
            <StepCard
              number="2"
              icon="🔒"
              title="Stored encrypted & scoped"
              body="Profiles are saved to your school's workspace with AES-256-GCM encryption and strict role-based access. Only involved teachers ever see the details."
            />
          </Reveal>
          <Reveal delay={300}>
            <StepCard
              number="3"
              icon="📋"
              title="Day-1 dashboard"
              body="The reviewing teacher opens a clean dashboard, reviews each student, and acknowledges profiles with a single tap — timestamped and logged."
            />
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <Reveal className="text-center">
          <PillBadge>Our team</PillBadge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Meet the founders</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
            Four co-founders building EduHandover to make every classroom transition smooth, structured, and stress-free.
          </p>
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((member, i) => (
            <Reveal key={member.name} delay={i * 120}>
              <TeamCard name={member.name} role={member.role} initials={member.initials} gradient={member.gradient} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-primary via-primary-dark to-fuchsia-800 p-8 shadow-lift sm:p-12">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-2xl animate-drift-slow" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-accent/20 blur-3xl animate-drift" />
            <div className="relative grid items-center gap-8 md:grid-cols-2">
              <div>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  For schools
                </span>
                <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  Your next teacher starts Day 1 ready
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-indigo-100">
                  Admins purchase access for their school, invite teachers by email, and watch every handover get
                  acknowledged — all in one calm, consistent workspace.
                </p>
                <button
                  onClick={() => setDemoOpen(true)}
                  className="mt-6 rounded-full bg-white px-6 py-3 text-sm font-bold text-primary transition hover:-translate-y-0.5 hover:bg-indigo-50"
                >
                  Book a demo
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["7", "students per demo class"],
                  ["21", "preset tags"],
                  ["2", "roles + admin"],
                  ["100%", "tag-driven insight"],
                ].map(([value, label], i) => (
                  <div
                    key={label}
                    className={`rounded-2xl bg-white/10 p-5 text-center backdrop-blur animate-float-slow`}
                    style={{ animationDelay: `${i * 500}ms` }}
                  >
                    <p className="text-2xl font-extrabold text-white">{value}</p>
                    <p className="mt-1 text-xs text-indigo-100">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <Reveal className="text-center">
          <PillBadge>FAQ</PillBadge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Frequently asked questions
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-10">
            <FAQAccordion items={FAQS} />
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-border-soft/70 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-muted sm:flex-row sm:px-6">
          <span>EduHandover — Bridge every classroom transition</span>
          <span>© 2026 EduHandover</span>
        </div>
        <div className="mt-4 text-center text-xs text-muted">
          Made by Saja Waleed · Ziad Ahmed · Younes Mohamed · Mohamed Elghobashy
        </div>
      </footer>

      <BookDemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
