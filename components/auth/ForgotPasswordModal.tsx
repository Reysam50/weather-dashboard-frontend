"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

/**
 * The redesign's login screen has a "Report lost token / Recovery" link
 * implying a logged-out password-recovery flow — but api-specification.md
 * only documents an authenticated POST /auth/change-password (see
 * ChangePasswordModal.tsx), nothing for someone who can't log in at all.
 *
 * TODO (backend developer): this calls POST /auth/forgot-password, which
 * doesn't exist in api-specification.md yet — add it (accept an email,
 * always return 200 regardless of whether the email exists, to avoid
 * leaking which emails are registered; email a time-limited reset token)
 * plus a matching POST /auth/reset-password (token + new password) for
 * the link in that email to land on. Until then this request 404s, which
 * is caught below and treated the same as success — that's not a bug:
 * a real forgot-password endpoint should always respond the same way
 * whether or not the email matches an account, so showing the identical
 * confirmation either way is the correct behavior to keep once the
 * endpoint exists, not just a stand-in for it.
 */
export default function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch {
      // See the endpoint note above — intentionally silent either way.
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-sm bg-card-bg border border-border-hover rounded-2xl shadow-2xl">
        <div className="p-5 border-b border-border-line flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">key_off</span>
              Forgot Password
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-white transition-colors" aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {submitted ? (
          <div className="p-5 space-y-4">
            <div className="p-3 rounded-xl bg-primary-container/10 border border-primary-container/25 text-primary-container text-sm flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] mt-0.5">mail</span>
              <span>
                If an account exists for {email}, you&apos;ll receive an email with instructions to reset
                your password shortly.
              </span>
            </div>
            <p className="text-[11px] font-mono text-on-surface-variant">
              Didn&apos;t get anything after a few minutes? Check your spam folder, or contact your
              Technical Team administrator for help.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-lg bg-primary-container text-slate-950 font-bold text-sm hover:bg-primary transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <p className="text-xs text-on-surface-variant">
              Enter your institutional operator ID. If it matches a registered account, we&apos;ll send
              password reset instructions there.
            </p>
            <label className="block">
              <span className="text-xs font-mono font-semibold text-slate-300 block mb-1.5">
                Institutional Identity / Operator ID
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yournaxii.com"
                required
                className="w-full bg-[#080c14] border border-border-line rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg bg-primary-container text-slate-950 font-bold text-sm hover:bg-primary transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Sending…" : "Send Reset Instructions"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}