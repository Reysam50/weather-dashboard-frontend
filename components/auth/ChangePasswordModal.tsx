"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { signOut } from "@/lib/logout";

/**
 * Matches POST /auth/change-password exactly (api-specification.md §3):
 * { current_password, new_password } -> 200 { success: true } or 401 if
 * current_password is wrong. Every role can call this for their own
 * account — there's no admin-reset-someone-else's-password endpoint (by
 * design, see 11-screen-sync/login.md §3), so this only ever changes the
 * signed-in user's own password.
 *
 * Two modes:
 * - Normal (default): opened manually from the header's account menu
 *   (AccountMenu.tsx). Dismissable.
 * - `forced`: rendered by app/(protected)/layout.tsx when GET /auth/me says
 *   `must_change_password` is true (admin-issued temp password). NOT
 *   dismissable — no close button, backdrop clicks do nothing — the only
 *   ways out are changing the password (then `onClose` fires from the
 *   "Continue" button so the layout can drop the flag and show the app)
 *   or signing out. The new password must also differ from the temporary
 *   one, otherwise "changing" it would defeat the point.
 */
export default function ChangePasswordModal({
  onClose,
  forced = false,
}: {
  onClose: () => void;
  forced?: boolean;
}) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const sameAsCurrent = forced && newPassword.length > 0 && newPassword === currentPassword;
  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword &&
    !sameAsCurrent;

  async function handleSignOut() {
    setIsSigningOut(true);
    await signOut();
    router.push("/login");
  }

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
      {forced ? (
        <div className="absolute inset-0 bg-[#05080f]" />
      ) : (
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />
      )}
      <div className="relative w-full max-w-sm bg-card-bg border border-border-hover rounded-2xl shadow-2xl">
        <div className="p-5 border-b border-border-line flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container text-[20px]">password</span>
              {forced ? "Set a New Password" : "Change Password"}
            </h2>
            <p className="text-xs font-mono text-on-surface-variant mt-1">
              {forced
                ? "Your account was created with a temporary password. Choose your own to continue."
                : "Updates your own credentials immediately."}
            </p>
          </div>
          {!forced && (
            <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-white transition-colors" aria-label="Close">
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
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
              {forced ? "Continue" : "Done"}
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
              {sameAsCurrent && (
                <span className="text-[10px] text-error mt-1 block">
                  New password must be different from your temporary one.
                </span>
              )}
            </label>
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="w-full py-2.5 rounded-lg bg-primary-container text-slate-950 font-bold text-sm hover:bg-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Changing…" : forced ? "Set New Password" : "Change Password"}
            </button>
            {forced && (
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full text-center text-xs font-mono text-on-surface-variant hover:text-white underline underline-offset-2 disabled:opacity-50"
              >
                {isSigningOut ? "Signing out…" : "Sign out instead"}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}