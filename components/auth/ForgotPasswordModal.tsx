"use client";

import { useState } from "react";

/**
 * The redesign's login screen has a "Report lost token / Recovery" link
 * implying a logged-out password-recovery flow — but api-specification.md
 * only documents an authenticated POST /auth/change-password (see
 * ChangePasswordModal.tsx), nothing for someone who can't log in at all.
 *
 * TODO (backend developer): this needs real endpoints before it can do
 * anything — something like POST /auth/forgot-password (accepts an email,
 * always returns 200 regardless of whether the email exists, to avoid
 * leaking which emails are registered) and POST /auth/reset-password
 * (accepts the emailed token + new password). Until those exist, this
 * stops after the "request" step and is honest about not actually
 * sending anything.
 */
export default function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
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
              Report Lost Token / Recovery
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
              <span>If an account exists for {email}, recovery instructions have been sent.</span>
            </div>
            <p className="text-[11px] font-mono text-on-surface-variant">
              This is a UI placeholder — no email is actually sent yet; the backend doesn&apos;t have a
              password-recovery endpoint built. Contact your Technical Team administrator directly for now.
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
              recovery instructions there.
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
              className="w-full py-2.5 rounded-lg bg-primary-container text-slate-950 font-bold text-sm hover:bg-primary transition-colors"
            >
              Send Recovery Instructions
            </button>
          </form>
        )}
      </div>
    </div>
  );
}