"use client";

import { useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";

/**
 * Matches POST /auth/change-password exactly (api-specification.md §3):
 * { current_password, new_password } -> 200 { success: true } or 401 if
 * current_password is wrong. Every role can call this for their own
 * account — there's no separate admin-reset-someone-else's-password
 * endpoint documented, so this only ever changes the signed-in user's own
 * password.
 *
 * The backend doesn't expose a "you must change your password" flag on
 * login (checked api-specification.md — GET /auth/me and the login
 * response only return id/email/role/stations), so this can't auto-open
 * on a real first-login signal. It's reachable manually instead, from the
 * header's account menu (see AccountMenu.tsx).
 */
export default function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmit =
    currentPassword.length > 0 && newPassword.length >= 8 && newPassword === confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Current password is incorrect.");
      } else {
        setError("Something went wrong changing your password. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
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
              <span className="material-symbols-outlined text-primary-container text-[20px]">password</span>
              Change Password
            </h2>
            <p className="text-xs font-mono text-on-surface-variant mt-1">
              Updates your own credentials immediately.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-white transition-colors" aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {success ? (
          <div className="p-5 space-y-4">
            <div className="p-3 rounded-xl bg-primary-container/10 border border-primary-container/25 text-primary-container text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              Password changed successfully.
            </div>
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
            {error && (
              <div className="p-3 rounded-xl bg-error/10 border border-error/25 text-error text-sm">{error}</div>
            )}
            <label className="block">
              <span className="text-xs font-mono font-semibold text-slate-300 block mb-1.5">Current Password</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full bg-[#080c14] border border-border-line rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </label>
            <label className="block">
              <span className="text-xs font-mono font-semibold text-slate-300 block mb-1.5">New Password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full bg-[#080c14] border border-border-line rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[10px] text-on-surface-variant mt-1 block">Minimum 8 characters.</span>
            </label>
            <label className="block">
              <span className="text-xs font-mono font-semibold text-slate-300 block mb-1.5">Confirm New Password</span>
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
              {isSubmitting ? "Changing…" : "Change Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}