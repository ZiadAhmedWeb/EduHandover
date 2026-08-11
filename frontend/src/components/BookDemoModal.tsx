import { useState, type FormEvent } from "react";
import { api, extractError } from "../api/client";

const STUDENT_COUNTS = ["Under 250", "250 - 500", "500 - 1,000", "1,000+"];

const inputClass =
  "w-full rounded-xl border border-border-soft bg-canvas px-4 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light";

const labelClass = "mb-1.5 block text-sm font-semibold text-ink";

export default function BookDemoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [fullName, setFullName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [studentCount, setStudentCount] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setFullName("");
    setWorkEmail("");
    setSchoolName("");
    setStudentCount("");
    setMessage("");
    setSubmitting(false);
    setSuccess(false);
    setError(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/leads", {
        fullName,
        workEmail,
        schoolName,
        studentCount,
        message: message.trim() || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="my-auto w-full max-w-lg animate-fade-in-scale rounded-card border border-border-soft bg-card p-6 shadow-2xl">
        {success ? (
          <div className="py-6 text-center">
            <span className="text-4xl">�???</span>
            <h2 className="mt-4 text-xl font-bold text-ink">Request received</h2>
            <p className="mt-2 text-sm text-muted">
              Thank you! Our school onboarding team will reach out to {workEmail} within 24 hours to schedule
              your demo.
            </p>
            <button
              onClick={close}
              className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white transition hover:bg-primary-dark"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-ink">Book a demo</h2>
                <p className="mt-1 text-sm text-muted">
                  Tell us about your school and we'll reach out within 24 hours.
                </p>
              </div>
              <button
                onClick={close}
                aria-label="Close"
                className="rounded-full p-2 text-muted transition hover:bg-canvas hover:text-ink"
              >
                �??
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className={labelClass} htmlFor="leadFullName">
                  Full name
                </label>
                <input
                  id="leadFullName"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jordan Ellis"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="leadWorkEmail">
                  Work email
                </label>
                <input
                  id="leadWorkEmail"
                  type="email"
                  required
                  value={workEmail}
                  onChange={(e) => setWorkEmail(e.target.value)}
                  placeholder="j.ellis@district.edu"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="leadSchoolName">
                  School or district
                </label>
                <input
                  id="leadSchoolName"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Riverside School District"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="leadStudentCount">
                  Approximate student count
                </label>
                <select
                  id="leadStudentCount"
                  required
                  value={studentCount}
                  onChange={(e) => setStudentCount(e.target.value)}
                  className={inputClass}
                >
                  <option value="" disabled>
                    Select a range
                  </option>
                  {STUDENT_COUNTS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="leadMessage">
                  Anything else we should know? <span className="font-normal text-muted">(optional)</span>
                </label>
                <textarea
                  id="leadMessage"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. We have a big transition coming in August."
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary-dark disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Request a demo"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
