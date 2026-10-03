"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";

/**
 * Landing page for the link in the password-reset email
 * (11-screen-sync/login.md §4). Public route — deliberately OUTSIDE
 * app/(protected), since the person on it is by definition not signed in.
 *
 * Expected link format (to be confirmed with the backend developer):
 *   <frontend-origin>/reset-password?token=<reset-token>
 *
 * Calls POST /auth/reset-password with { token, new_password }. The backend
 * shouldn't set must_change_password for this — the user picked this
 * password themselves — so on success they just go back to /login.
 *
 * Error handling: any 4xx is shown as "link invalid or expired" (we don't
 * rely on a specific status code since the backend contract doesn't pin one
 * down yet); anything else is a generic retry message.
 */
function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmit = newPassword.length >= 8 && newPassword === confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !token) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        setError(
          "This reset link is invalid or has expired. Request a new one from the login screen."
        );
      } else {
        setError("Something went wrong resetting your password. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-sm bg-card-bg border border-border-hover rounded-2xl shadow-2xl">
      <div className="p-5 border-b border-border-line">
        <h1 className="text-base font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container text-[20px]">lock_reset</span>
          Reset Password
        </h1>
        <p className="text-xs font-mono text-on-surface-variant mt-1">
          Choose a new password for your account.
        </p>
      </div>

      {!token ? (
        <div className="p-5 space-y-4">
          <div className="p-3 rounded-xl bg-error/10 border border-error/25 text-error text-sm">
            This reset link is missing its token. Open the link from your email again, or request a
            new one.
          </div>
          <Link
            href="/login"
            className="block w-full py-2.5 rounded-lg bg-primary-container text-slate-950 font-bold text-sm text-center hover:bg-primary transition-colors"
          >
            Back to Login
          </Link>
        </div>
      ) : success ? (
        <div className="p-5 space-y-4">
          <div className="p-3 rounded-xl bg-primary-container/10 border border-primary-container/25 text-primary-container text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            Password reset. You can now sign in.
          </div>
          <Link
            href="/login"
            className="block w-full py-2.5 rounded-lg bg-primary-container text-slate-950 font-bold text-sm text-center hover:bg-primary transition-colors"
          >
            Go to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/25 text-error text-sm">{error}</div>
          )}
          <label className="block">
            <span className="text-xs font-mono font-semibold text-slate-300 block mb-1.5">New Password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              autoFocus
              required
              minLength={8}
              className="w-full bg-[#080c14] border border-border-line rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
            />
            <span className="text-[10px] text-on-surface-variant mt-1 block">Minimum 8 characters.</span>
          </label>
          <label className="block">
            <span className="text-xs font-mono font-semibold text-slate-300 block mb-1.5">
              Confirm New Password
            </span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              className="w-full bg-[#080c14] border border-border-line rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
            />
            {mismatch && <span className="text-[10px] text-error mt-1 block">Passwords don&apos;t match.</span>}
          </label>
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full py-2.5 rounded-lg bg-primary-container text-slate-950 font-bold text-sm hover:bg-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Resetting…" : "Reset Password"}
          </button>
        </form>
      )}
    </div>
  );
}

// useSearchParams() needs a Suspense boundary in Next 14 or `next build`
// fails on this page.
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6">
      <Suspense fallback={<div className="text-gray-500 text-sm">Loading…</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}